import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pitch Deck Workspace - Webcoin Labs",
  description: "Founder-first pitch deck analysis and AI improvement workspace.",
};

export default async function PitchDeckEntryPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && ["FOUNDER", "ADMIN"].includes(session.user.role)) {
    redirect("/app/founder-os/pitch-deck");
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto max-w-3xl px-6">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Webcoin Labs</p>
          <h1 className="mt-2 text-3xl font-semibold">Pitch Deck Workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This workspace is now integrated inside Founder OS with free diagnosis and premium AI improvement tools.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
              Sign in as founder
            </Link>
            <Link href="/app/founder-os/pitch-deck" className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
              Open module
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

