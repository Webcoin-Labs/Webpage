import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SettingsForm } from "@/components/app/SettingsForm";
import { db } from "@/server/db/client";

export const metadata = { title: "Settings — Webcoin Labs" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const [dbUser, founderProfile, workspaces, wallets, integrations] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { username: true } }),
    db.founderProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.userWorkspace.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.walletConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.integrationConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <SettingsForm
        currentRole={user.role}
        email={user.email ?? undefined}
        name={user.name ?? undefined}
        username={dbUser?.username ?? undefined}
        founderProfileLocked={Boolean(founderProfile)}
      />

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Workspace, Wallet & Integrations</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspaces</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {workspaces.length === 0 ? (
                <p className="rounded-md border border-border/60 px-3 py-2">No workspace enabled yet.</p>
              ) : (
                workspaces.map((workspace) => (
                  <p key={workspace.id} className="rounded-md border border-border/60 px-3 py-2">
                    {workspace.workspace} {workspace.isDefault ? "(active)" : ""}
                  </p>
                ))
              )}
            </div>
            <a href="/app/workspaces" className="mt-2 inline-flex text-xs text-cyan-300">
              Open workspace switcher
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wallets</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {wallets.length === 0 ? (
                <p className="rounded-md border border-border/60 px-3 py-2">No wallet linked.</p>
              ) : (
                wallets.map((wallet) => (
                  <p key={wallet.id} className="rounded-md border border-border/60 px-3 py-2">
                    {wallet.network}: {wallet.address}
                  </p>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Integrations</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {integrations.length === 0 ? (
                <p className="rounded-md border border-border/60 px-3 py-2">No integration connected.</p>
              ) : (
                integrations.map((integration) => (
                  <p key={integration.id} className="rounded-md border border-border/60 px-3 py-2">
                    {integration.provider}: {integration.status}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
