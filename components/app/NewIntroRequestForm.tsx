"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createIntroRequest } from "@/app/actions/intro";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type Option = { id: string; label: string };

export function NewIntroRequestForm({
  projects,
  builders,
  partners,
  defaultType = "KOL",
  defaultPriorityTier = "STANDARD",
}: {
  projects: Option[];
  builders: Option[];
  partners: Option[];
  defaultType?: "KOL" | "VC";
  defaultPriorityTier?: "STANDARD" | "PREMIUM";
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<"KOL" | "VC">(defaultType);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      const result = await createIntroRequest(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/app/intros"), 1600);
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Request submitted</h2>
        <p className="text-muted-foreground text-sm">We will review and update the intro status in your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-lg">
      <Link href="/app/intros" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Intros
      </Link>
      <h1 className="text-2xl font-bold mb-2">New intro request</h1>
      <p className="text-muted-foreground mb-8">Request a KOL or VC intro and optionally attach platform context.</p>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl border border-border/50 bg-card">
        <div>
          <label className="block text-xs font-medium mb-2">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="KOL" checked={type === "KOL"} onChange={() => setType("KOL")} className="accent-cyan-500" />
              KOL intro
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="VC" checked={type === "VC"} onChange={() => setType("VC")} className="accent-cyan-500" />
              VC intro
            </label>
          </div>
        </div>

        {type === "KOL" ? (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Tier</label>
              <select
                name="priorityTier"
                defaultValue={defaultPriorityTier}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <input name="category" required placeholder="Category (e.g. DeFi, Gaming)" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            <input name="budgetRange" required placeholder="Budget range" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            <textarea name="campaignGoal" required rows={3} placeholder="Campaign goal" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                name="targetRegion"
                placeholder="Target region (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                min={1}
                max={200}
                name="targetKolCount"
                placeholder="KOL count"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                min={1}
                max={180}
                name="timelineDays"
                placeholder="Timeline (days)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Premium requests are prioritized in matching workflows and surfaced in the KOL Premium dashboard.
            </p>
          </>
        ) : (
          <>
            <input name="category" required placeholder="Category / focus" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            <input name="stage" required placeholder="Stage (e.g. Seed)" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
            <input name="region" required placeholder="Region (e.g. Global)" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
          </>
        )}

        <div className="space-y-3 border-t border-border/60 pt-4">
          <p className="text-xs font-medium text-muted-foreground">Optional request context</p>
          <select name="sourceProjectId" defaultValue="" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm">
            <option value="">Source project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
          <select name="targetUserId" defaultValue="" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm">
            <option value="">Target builder (if specific)</option>
            {builders.map((builder) => (
              <option key={builder.id} value={builder.id}>
                {builder.label}
              </option>
            ))}
          </select>
          <select name="targetPartnerId" defaultValue="" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm">
            <option value="">Target partner (if specific)</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.label}
              </option>
            ))}
          </select>
          <textarea
            name="contextSummary"
            rows={3}
            placeholder="Add context for the intro team (optional)"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm disabled:opacity-60">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
