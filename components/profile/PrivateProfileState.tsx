import Link from "next/link";
import { Lock } from "lucide-react";

export function PrivateProfileState({
  username,
  roleLabel,
  openToConnections = true,
  source,
  viewerRole,
}: {
  username: string;
  roleLabel: string;
  openToConnections?: boolean;
  source?: string;
  viewerRole?: string;
}) {
  const connectHref = `/app/messages?source=${encodeURIComponent(source ?? "private-profile")}&username=${encodeURIComponent(username)}${
    viewerRole ? `&viewerRole=${encodeURIComponent(viewerRole)}` : ""
  }`;

  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-8 text-center">
        <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/80">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm font-semibold">{roleLabel} profile is private</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          @{username} has restricted public access for this profile.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {openToConnections ? (
            <Link href={connectHref} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
              Request Connect
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">Not accepting connections</span>
          )}
          <Link href="/app/ecosystem-feed" className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            Back to Feed
          </Link>
        </div>
      </section>
    </main>
  );
}
