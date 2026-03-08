"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Code2, Rocket, TrendingUp, Shield, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

const roles = [
  { value: "BUILDER", label: "Builder", desc: "I build products and want to connect with founders and projects.", icon: Code2 },
  { value: "FOUNDER", label: "Founder", desc: "I run a project and need funding, growth, and ecosystem access.", icon: Rocket },
  { value: "INVESTOR", label: "Investor", desc: "I want curated project visibility and founder updates.", icon: TrendingUp },
  { value: "ADMIN", label: "Admin", desc: "Invite-only access for the Webcoin Labs team.", icon: Shield, locked: true },
];

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const allowAdmin = session?.user?.role === "ADMIN";

  const handleSelect = (role: string) => {
    setError("");
    startTransition(async () => {
      const result = await completeOnboarding(role);
      if (result.success) {
        router.push("/app/profile?onboarding=1");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold mb-2">Welcome to Webcoin Labs</h1>
          <p className="text-muted-foreground text-sm">
            Choose your role, then complete your profile to unlock the dashboard.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const locked = r.locked && !allowAdmin;
            return (
              <button
                key={r.value}
                type="button"
                disabled={isPending || locked}
                onClick={() => handleSelect(r.value)}
                className="w-full flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card hover:border-cyan-500/40 hover:bg-accent/30 transition-all text-left disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {r.label}
                    {locked && <span className="ml-2 text-xs text-muted-foreground">Invite only</span>}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                {isPending && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
