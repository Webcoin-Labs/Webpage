"use client";

import { createContext, useContext } from "react";
import type { AppSession } from "@/lib/auth";
import { isSupabaseAuthEnabled } from "@/lib/auth-config";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthContextValue = {
  session: AppSession | null;
};

const AuthContext = createContext<AuthContextValue>({ session: null });

export function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AppSession | null;
}) {
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const { session } = useContext(AuthContext);

  return {
    data: session,
    status: session ? "authenticated" as const : "unauthenticated" as const,
  };
}

export async function signOut(options?: { callbackUrl?: string }) {
  const callbackUrl = options?.callbackUrl ?? "/";

  if (isSupabaseAuthEnabled) {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }

  window.location.href = callbackUrl;
}
