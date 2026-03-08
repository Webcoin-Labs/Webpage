"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const allowed = pathname === "/app/onboarding" || pathname === "/app/profile";

    useEffect(() => {
        if (!allowed) {
            router.replace("/app/onboarding");
        }
    }, [allowed, router]);

    if (!allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
        );
    }

    return <>{children}</>;
}
