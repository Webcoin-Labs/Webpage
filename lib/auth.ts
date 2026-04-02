import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { Role, type User } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { authConfig, isSupabaseAuthEnabled } from "@/lib/auth-config";
import { db } from "@/server/db/client";
import { getLegacyServerSession, legacyAuthOptions } from "@/lib/auth-legacy";

export type AppSessionUser = {
  id: string;
  role: Role;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  onboardingComplete?: boolean;
  supabaseAuthId?: string | null;
  authProvider?: string | null;
};

export type AppSession = {
  user: AppSessionUser;
};

export const authOptions = legacyAuthOptions;

function deriveDisplayName(supabaseUser: SupabaseUser) {
  const metadata = supabaseUser.user_metadata ?? {};
  const candidate =
    metadata.full_name ??
    metadata.name ??
    metadata.user_name ??
    metadata.preferred_username ??
    supabaseUser.email?.split("@")[0];

  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
}

function deriveAvatarUrl(supabaseUser: SupabaseUser) {
  const metadata = supabaseUser.user_metadata ?? {};
  const candidate = metadata.avatar_url ?? metadata.picture;
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
}

function deriveAuthProvider(supabaseUser: SupabaseUser) {
  if (typeof supabaseUser.app_metadata?.provider === "string") {
    return supabaseUser.app_metadata.provider;
  }

  const identities = Array.isArray(supabaseUser.identities) ? supabaseUser.identities : [];
  const provider = identities.find((identity: { provider?: string | null }) => typeof identity.provider === "string")?.provider;
  return provider ?? "email";
}

function buildSessionUser(user: Pick<User, "id" | "role" | "email" | "name" | "image" | "username" | "onboardingComplete" | "supabaseAuthId" | "authProvider">): AppSessionUser {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    image: user.image,
    username: user.username,
    onboardingComplete: user.onboardingComplete,
    supabaseAuthId: user.supabaseAuthId,
    authProvider: user.authProvider,
  };
}

export async function syncSupabaseUserToAppUser(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Authenticated Supabase user does not have an email address.");
  }

  const provider = deriveAuthProvider(supabaseUser);
  const derivedName = deriveDisplayName(supabaseUser);
  const derivedAvatar = deriveAvatarUrl(supabaseUser);
  const emailVerified = supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null;

  const existingUser =
    await db.user.findUnique({
      where: { supabaseAuthId: supabaseUser.id },
      select: {
        id: true,
        role: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        username: true,
        onboardingComplete: true,
        supabaseAuthId: true,
        authProvider: true,
      },
    }) ??
    await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        username: true,
        onboardingComplete: true,
        supabaseAuthId: true,
        authProvider: true,
      },
    });

  if (existingUser) {
    const updateData: {
      email?: string;
      emailVerified?: Date | null;
      supabaseAuthId?: string;
      authProvider?: string;
      name?: string | null;
      image?: string | null;
    } = {};

    if (existingUser.email !== email) {
      updateData.email = email;
    }

    const existingVerifiedAt = existingUser.emailVerified?.toISOString() ?? null;
    const incomingVerifiedAt = emailVerified?.toISOString() ?? null;
    if (existingVerifiedAt !== incomingVerifiedAt) {
      updateData.emailVerified = emailVerified;
    }

    if (!existingUser.supabaseAuthId) {
      updateData.supabaseAuthId = supabaseUser.id;
    }

    if (existingUser.authProvider !== provider) {
      updateData.authProvider = provider;
    }

    if (!existingUser.name?.trim() && derivedName) {
      updateData.name = derivedName;
    }

    if (!existingUser.image?.trim() && derivedAvatar) {
      updateData.image = derivedAvatar;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        id: existingUser.id,
        role: existingUser.role,
        email: existingUser.email,
        name: existingUser.name,
        image: existingUser.image,
        username: existingUser.username,
        onboardingComplete: existingUser.onboardingComplete,
        supabaseAuthId: existingUser.supabaseAuthId,
        authProvider: existingUser.authProvider,
      };
    }

    return db.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        image: true,
        username: true,
        onboardingComplete: true,
        supabaseAuthId: true,
        authProvider: true,
      },
    });
  }

  const createdUser = await db.user.create({
    data: {
      supabaseAuthId: supabaseUser.id,
      authProvider: provider,
      email,
      emailVerified: emailVerified ?? undefined,
      name: derivedName,
      image: derivedAvatar,
      role: "BUILDER",
      onboardingComplete: false,
    },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
      image: true,
      username: true,
      onboardingComplete: true,
      supabaseAuthId: true,
      authProvider: true,
    },
  });

  return createdUser;
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // In Server Components, cookie writes are not allowed.
            // Route Handlers / Server Actions still persist auth cookies.
          }
        });
      },
    },
  });
}

const getSupabaseAuthUserCached = cache(async () => {
  if (!isSupabaseAuthEnabled) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export async function getSupabaseAuthUser() {
  return getSupabaseAuthUserCached();
}

const getCurrentAppUserCached = cache(async () => {
  if (!isSupabaseAuthEnabled) {
    const legacySession = await getLegacyServerSession(legacyAuthOptions);
    if (!legacySession?.user?.id) return null;
    return db.user.findUnique({
      where: { id: legacySession.user.id },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        image: true,
        username: true,
        onboardingComplete: true,
        supabaseAuthId: true,
        authProvider: true,
      },
    });
  }

  const supabaseUser = await getSupabaseAuthUser();
  if (!supabaseUser) return null;
  return syncSupabaseUserToAppUser(supabaseUser);
});

export async function getCurrentAppUser() {
  return getCurrentAppUserCached();
}

const getServerSessionCached = cache(async (): Promise<AppSession | null> => {
  if (!isSupabaseAuthEnabled) {
    const legacySession = await getLegacyServerSession(legacyAuthOptions);
    return legacySession as AppSession | null;
  }

  const appUser = await getCurrentAppUser();
  if (!appUser) return null;
  return { user: buildSessionUser(appUser) };
});

export async function getServerSession(_options?: unknown): Promise<AppSession | null> {
  return getServerSessionCached();
}

export async function requireServerSession() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }
  return session;
}

export function getPostAuthRedirect(user: Pick<User, "role" | "username" | "onboardingComplete">, requestedPath?: string | null) {
  const safeRequestedPath =
    requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : null;

  if (!user.username?.trim()) {
    return "/app/onboarding";
  }

  if (!user.onboardingComplete) {
    return "/app";
  }

  if (safeRequestedPath && safeRequestedPath !== "/") {
    return safeRequestedPath;
  }

  return "/app";
}
