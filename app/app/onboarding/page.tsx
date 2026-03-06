"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Code2, Rocket, TrendingUp, Loader2 } from "lucide-react";

const roles = [
  { value: "BUILDER", label: "Builder", desc: "I build. I want to join programs, get support, and ship.", icon: Code2 },
  { value: "FOUNDER", label: "Founder", desc: "I run a project. I need advisory, intros, and support.", icon: Rocket },
  { value: "INVESTOR", label: "Investor", desc: "I want to see curated projects and stay in the loop.", icon: TrendingUp },
];

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSelect = (role: string) => {
    setError("");
    startTransition(async () => {
      const result = await completeOnboarding(role);
      if (result.success) {
        router.push("/app");
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
          <p className="text-muted-foreground text-sm">Choose how you&apos;ll use the platform. You can change this later in Settings.</p>
        </div>

        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(r.value)}
                className="w-full flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card hover:border-cyan-500/40 hover:bg-accent/30 transition-all text-left disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.label}</p>
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
