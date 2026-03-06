import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppSidebar } from "@/components/app/AppSidebar";
import { OnboardingGuard } from "@/components/app/OnboardingGuard";
import { AppHelpWidget } from "@/components/app/AppHelpWidget";

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
                <div className="min-h-screen flex bg-background items-center justify-center">
                    {children}
                </div>
            </OnboardingGuard>
        );
    }

    return (
        <div className="min-h-screen flex bg-background">
            <AppSidebar user={session.user} />
            <main className="flex-1 ml-0 md:ml-64 min-h-screen">
                <div className="h-16 border-b border-border/50 flex items-center px-6 md:hidden">
                    <span className="font-bold gradient-text">Webcoin Labs</span>
                </div>
                <div className="p-6 max-w-5xl mx-auto relative">{children}</div>
            <AppHelpWidget />
            </main>
        </div>
    );
}
