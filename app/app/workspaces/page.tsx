import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, Briefcase, Rocket, ArrowRightLeft } from "lucide-react";
import { db } from "@/server/db/client";
import { switchWorkspace } from "@/app/actions/webcoin-os";

export const metadata = { title: "Workspace Switcher - Webcoin Labs" };

const workspaceMeta = {
  FOUNDER_OS: {
    title: "Founder OS",
    description: "Venture operations, investor discovery, deck workflows, builder discovery.",
    icon: Rocket,
    href: "/app/founder-os",
  },
  BUILDER_OS: {
    title: "Builder OS",
    description: "Projects, GitHub proof, resume/cover letter, and collaboration intent.",
    icon: Briefcase,
    href: "/app/builder-os",
  },
  INVESTOR_OS: {
    title: "Investor OS",
    description: "Deal flow inbox, thesis fit, founder applications, and investor identity.",
    icon: Building2,
    href: "/app/investor-os",
  },
} as const;

export default async function WorkspacesPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const memberships = await db.userWorkspace.findMany({
    where: { userId: session.user.id, status: "ENABLED" },
    orderBy: { createdAt: "asc" },
  });
  const enabled = new Set(memberships.map((item) => item.workspace));

  const switchAction = async (formData: FormData) => {
    "use server";
    await switchWorkspace(String(formData.get("workspace") ?? ""));
  };

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Multi-role workspace switcher
        </div>
        <h1 className="text-2xl font-semibold">Choose Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One identity, multiple role-enabled workspaces. Founder and Builder can coexist. Investor access remains role-aware.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(Object.keys(workspaceMeta) as Array<keyof typeof workspaceMeta>).map((workspace) => {
          const item = workspaceMeta[workspace];
          const Icon = item.icon;
          const active = memberships.some((membership) => membership.workspace === workspace && membership.isDefault);
          const allowed = enabled.has(workspace);

          return (
            <div key={workspace} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <span
                  className={
                    active
                      ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200"
                      : "rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                  }
                >
                  {active ? "Active" : allowed ? "Enabled" : "Not Enabled"}
                </span>
              </div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              {allowed ? (
                <div className="mt-4 flex gap-2">
                  <form action={switchAction} className="flex-1">
                    <input type="hidden" name="workspace" value={workspace} />
                    <button type="submit" className="w-full rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                      Switch
                    </button>
                  </form>
                  <a href={item.href} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                    Open
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">Enable from onboarding or role-specific setup.</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

