"use client";

import { createBrowserClient } from "@supabase/ssr";
import { authConfig } from "@/lib/auth-config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!authConfig.supabaseUrl || !authConfig.supabaseAnonKey) {
    throw new Error("Supabase Auth is not configured.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey);
  }

  return browserClient;
}
