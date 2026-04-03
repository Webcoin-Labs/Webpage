"use client";

import { AuthSessionProvider } from "@/lib/auth-client";
import type { AppSession } from "@/lib/auth";

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AppSession | null;
}) {
  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
