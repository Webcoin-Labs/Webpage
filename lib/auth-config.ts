export const authConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
};

export const isSupabaseAuthEnabled =
  authConfig.supabaseUrl.length > 0 && authConfig.supabaseAnonKey.length > 0;
