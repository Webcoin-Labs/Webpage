"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createIntroRequest } from "@/app/actions/intro";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function NewIntroPage() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<"KOL" | "VC">("KOL");
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
        setTimeout(() => router.push("/app/intros"), 2000);
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
        <p className="text-muted-foreground text-sm">We&apos;ll review and get back to you. No contact lists are shared publicly.</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-lg">
      <Link href="/app/intros" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Intros
      </Link>
      <h1 className="text-2xl font-bold mb-2">New intro request</h1>
      <p className="text-muted-foreground mb-8">Request a KOL or VC intro. We match internally — contact details are never exposed.</p>

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

        {type === "KOL" && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5">Category <span className="text-destructive">*</span></label>
              <input name="category" required placeholder="e.g. DeFi, Gaming" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Budget range <span className="text-destructive">*</span></label>
              <input name="budgetRange" required placeholder="e.g. $5K–$20K" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Campaign goal <span className="text-destructive">*</span></label>
              <textarea name="campaignGoal" required rows={3} placeholder="What you want to achieve with this campaign" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none" />
            </div>
          </>
        )}

        {type === "VC" && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5">Category / focus <span className="text-destructive">*</span></label>
              <input name="category" required placeholder="e.g. DeFi, Infra" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Stage <span className="text-destructive">*</span></label>
              <input name="stage" required placeholder="e.g. Pre-seed, Seed" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Region <span className="text-destructive">*</span></label>
              <input name="region" required placeholder="e.g. Global, EU, US" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
