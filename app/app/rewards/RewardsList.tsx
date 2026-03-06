"use client";

import { useTransition, useState } from "react";
import { claimReward } from "@/app/actions/rewards";
import type { Reward } from "@prisma/client";
import { Loader2, Gift } from "lucide-react";

export function RewardsList({ rewards }: { rewards: Reward[] }) {
  const [isPending, startTransition] = useTransition();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleClaim = (id: string) => {
    setError("");
    setClaimingId(id);
    startTransition(async () => {
      const result = await claimReward(id);
      setClaimingId(null);
      if (!result.success) setError(result.error);
    });
  };

  const pending = rewards.filter((r) => r.status === "PENDING");
  const claimed = rewards.filter((r) => r.status === "CLAIMED");

  if (rewards.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-border/50 rounded-xl">
        <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="font-medium mb-1">No rewards yet</p>
        <p className="text-sm text-muted-foreground">When you have pending rewards, they&apos;ll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pending</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="p-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{r.label}</p>
                  <p className="text-sm text-muted-foreground">Amount: {r.amountText}</p>
                </div>
                <button
                  onClick={() => handleClaim(r.id)}
                  disabled={isPending && claimingId === r.id}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 disabled:opacity-60 flex items-center gap-2"
                >
                  {isPending && claimingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Claim
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {claimed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Claimed</h2>
          <div className="space-y-3">
            {claimed.map((r) => (
              <div key={r.id} className="p-5 rounded-xl border border-border/50 bg-card opacity-75">
                <p className="font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">Claimed {r.claimedAt ? new Date(r.claimedAt).toLocaleDateString() : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
