import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { authConfig } from "@/lib/auth-config";
import { getPostAuthRedirect, syncSupabaseUserToAppUser } from "@/lib/auth";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!authConfig.supabaseUrl || !authConfig.supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=auth_not_configured", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const appUser = await syncSupabaseUserToAppUser(user);
  const redirectPath = getPostAuthRedirect(appUser, nextPath);
  return NextResponse.redirect(new URL(redirectPath, request.url));
}
