import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { AppMobileNav, AppSidebar } from "@/components/app/AppSidebar";
import { OnboardingGuard } from "@/components/app/OnboardingGuard";
import { AppHelpWidget } from "@/components/app/AppHelpWidget";
import { prisma } from "@/lib/prisma";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";

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

  if (!onboardingComplete) {
    return (
      <OnboardingGuard>
        <div className="flex min-h-screen items-center justify-center bg-background">{children}</div>
      </OnboardingGuard>
    );
  }

  let sidebarAffiliation: { label: string; variant: "default" | "founder" | "independent" | "available" } | null = null;
  if (session.user.role === "FOUNDER") {
    const founderProfile = await prisma.founderProfile.findUnique({
      where: { userId: session.user.id },
      select: { companyName: true },
    });
    sidebarAffiliation = getFounderAffiliation(founderProfile);
  } else if (session.user.role === "BUILDER") {
    const builderProfile = await prisma.builderProfile.findUnique({
      where: { userId: session.user.id },
      select: { affiliation: true, independent: true, openToWork: true },
    });
    sidebarAffiliation = getBuilderAffiliation(builderProfile);
  } else if (session.user.role === "INVESTOR") {
    const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: session.user.id },
      select: { firmName: true },
    });
    sidebarAffiliation = investorProfile?.firmName?.trim()
      ? { label: investorProfile.firmName.trim(), variant: "default" }
      : null;
  }

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
        <AppMobileNav user={session.user} />
        <div className="relative mx-auto max-w-5xl p-6">{children}</div>
        <AppHelpWidget />
      </main>
    </div>
  );
}
