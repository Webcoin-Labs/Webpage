"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { retryPitchDeckAnalysis } from "@/app/actions/pitchdeck";

export function RetryAnalysisButton({ pitchDeckId }: { pitchDeckId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setError("");
          setSuccess(false);
          startTransition(async () => {
            const result = await retryPitchDeckAnalysis(pitchDeckId);
            if (result.success) setSuccess(true);
            else setError(result.error);
          });
        }}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/10 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
        {isPending ? "Retrying..." : "Retry Analysis"}
      </button>
      {success ? <p className="text-xs text-emerald-300">Retry started and completed.</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
