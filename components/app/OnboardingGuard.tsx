"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname !== "/app/onboarding") {
            router.replace("/app/onboarding");
        }
    }, [pathname, router]);

    if (pathname !== "/app/onboarding") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
        );
    }

    return <>{children}</>;
}
