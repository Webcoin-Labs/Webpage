import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { BellRing, Command, Plus, Search, Wifi } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AppMobileNav, AppSidebar } from "@/components/app/AppSidebar";
import { OnboardingGuard } from "@/components/app/OnboardingGuard";
import { AppHelpWidgetClient } from "@/components/app/AppHelpWidgetClient";
import { db } from "@/server/db/client";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";

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

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={session.user} affiliation={sidebarAffiliation} />
      <main className="ml-0 min-h-screen flex-1 md:ml-64">
        <div className="flex h-16 items-center border-b border-border/50 px-6 md:hidden">
          <div className="flex items-center gap-2">
            <Image src="/logo/webcoinlogo.webp" alt="Webcoin Labs" width={28} height={28} className="hidden rounded-md dark:block" />
            <Image src="/logo/webcoinlight.webp" alt="Webcoin Labs" width={28} height={28} className="rounded-md dark:hidden" />
            <span className="font-bold text-foreground">Webcoin Labs</span>
          </div>
        </div>
        <div className="hidden items-center justify-between gap-3 border-b border-border/40 px-6 py-2 text-xs text-muted-foreground md:flex">
          <label className="flex min-w-[320px] max-w-[520px] flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
            <Search className="h-3.5 w-3.5" />
            <input
              placeholder="Search workspaces, apps, people..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            />
          </label>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1.5">
              <Command className="h-3.5 w-3.5" /> Command
            </button>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-200">
              <Plus className="h-3.5 w-3.5" /> Quick Create
            </button>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1.5">
              <Wifi className="h-3.5 w-3.5 text-emerald-300" /> Sync Active
            </span>
            <Link href="/app/notifications" className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1.5 hover:text-foreground">
              <BellRing className="h-3.5 w-3.5" /> {unreadNotifications}
            </Link>
            {session.user.role === "ADMIN" ? (
              <Link href="/app/admin/notifications" className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-amber-200">
                Broadcast
              </Link>
            ) : null}
          </div>
        </div>
        <AppMobileNav user={session.user} />
        <div className="relative mx-auto max-w-[1300px] p-6">{children}</div>
        <AppHelpWidgetClient />
      </main>
    </div>
  );
}
