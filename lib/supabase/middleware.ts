import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { authConfig } from "@/lib/auth-config";

export async function updateSupabaseSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: SupabaseUser | null;
}> {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
