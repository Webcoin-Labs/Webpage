import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { BellRing, Command, Plus, Search, Wifi } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AppMobileNav, AppSidebar } from "@/components/app/AppSidebar";
import { OnboardingGuard } from "@/components/app/OnboardingGuard";
import { AppHelpWidgetClient } from "@/components/app/AppHelpWidgetClient";
import { db } from "@/server/db/client";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { AppTopNavUserMenu } from "@/components/app/AppTopNavUserMenu";

type SidebarAffiliation = {
  label: string;
  variant: "default" | "founder" | "independent" | "available";
};

type AppUserRole = "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN";

const getSidebarAffiliationCached = unstable_cache(
  async (userId: string, role: AppUserRole): Promise<SidebarAffiliation | null> => {
    if (role === "FOUNDER") {
      const founderProfile = await db.founderProfile.findUnique({
        where: { userId },
        select: { companyName: true },
      });
      return getFounderAffiliation(founderProfile);
    }

    if (role === "BUILDER") {
      const builderProfile = await db.builderProfile.findUnique({
        where: { userId },
        // Keep this layout resilient if the DB schema is behind migrations.
        select: { independent: true, openToWork: true },
      });
      return getBuilderAffiliation(
        builderProfile as unknown as {
          affiliation?: string | null;
          independent?: boolean | null;
          openToWork?: boolean | null;
        },
      );
    }

    if (role === "INVESTOR") {
      const investorProfile = await db.investorProfile.findUnique({
        where: { userId },
        select: { firmName: true },
      });
      return investorProfile?.firmName?.trim()
        ? { label: investorProfile.firmName.trim(), variant: "default" }
        : null;
    }

    return null;
  },
  ["app-layout-sidebar-affiliation"],
  { revalidate: 120 },
);

const getUnreadNotificationsCached = unstable_cache(
  async (userId: string, role: AppUserRole) =>
    db.notification.count({
      where: {
        targetRoles: {
          has: role,
        },
        reads: {
          none: {
            userId,
          },
        },
      },
    }),
  ["app-layout-unread-notifications"],
  { revalidate: 20 },
);

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const onboardingComplete = (session.user as { onboardingComplete?: boolean }).onboardingComplete !== false;
  const hasBaselineIdentity =
    Boolean(session.user.name?.trim()) &&
    Boolean((session.user as { username?: string | null }).username?.trim());

  // Prevent forced onboarding loops for users that already completed account creation.
  // Keep onboarding optional for role/workspace enrichment.
  const forceOnboarding = !onboardingComplete && !hasBaselineIdentity;

  if (forceOnboarding) {
    return (
      <OnboardingGuard>
        <div className="flex min-h-screen items-center justify-center bg-background">{children}</div>
      </OnboardingGuard>
    );
  }

  const [sidebarAffiliation, unreadNotifications] = await Promise.all([
    getSidebarAffiliationCached(session.user.id, session.user.role as AppUserRole),
    getUnreadNotificationsCached(session.user.id, session.user.role as AppUserRole),
  ]);
  const enabledWorkspaces = await db.userWorkspace.findMany({
    where: { userId: session.user.id, status: "ENABLED" },
    select: { workspace: true },
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <AppSidebar
        user={session.user}
        affiliation={sidebarAffiliation}
        enabledWorkspaces={enabledWorkspaces.map((item) => item.workspace)}
      />
      <main className="min-h-screen flex-1">
        <div
          className="flex h-14 items-center px-5 md:hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderBottom: "0.5px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold text-white"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              W
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Webcoin Labs</span>
          </div>
        </div>
        <div
          className="hidden items-center justify-between gap-3 px-5 py-2 text-xs md:flex"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderBottom: "0.5px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <label
            className="flex min-w-[320px] max-w-[520px] flex-1 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
            <input
              placeholder="Search workspaces, apps, people..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <Command className="h-3.5 w-3.5" /> Command
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-medium text-white"
              style={{
                backgroundColor: "var(--accent-color)",
                border: "0.5px solid var(--border-accent)",
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Quick Create
            </button>
            <span
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <Wifi className="h-3.5 w-3.5" style={{ color: "var(--green)" }} /> Sync Active
            </span>
            <Link
              href="/app/notifications"
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs transition-colors hover:text-[var(--text-primary)]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <BellRing className="h-3.5 w-3.5" /> {unreadNotifications}
            </Link>
            <AppTopNavUserMenu name={session.user.name} email={session.user.email} image={session.user.image} />
            {session.user.role === "ADMIN" ? (
              <Link
                href="/app/admin/notifications"
                className="rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--accent-dim)",
                  border: "0.5px solid var(--border-accent)",
                  color: "var(--accent-soft)",
                }}
              >
                Broadcast
              </Link>
            ) : null}
          </div>
        </div>
        <AppMobileNav user={session.user} enabledWorkspaces={enabledWorkspaces.map((item) => item.workspace)} />
        <div className="relative mx-auto max-w-[1300px] p-6">{children}</div>
        <AppHelpWidgetClient />
      </main>
    </div>
  );
}
