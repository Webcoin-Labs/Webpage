"use client";

import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { rateStartup } from "@/app/actions/founders";

type Props = {
  startupId: string;
  initialScore?: number | null;
};

export function StartupRatingForm({ startupId, initialScore }: Props) {
  const [isPending, startTransition] = useTransition();
  const [score, setScore] = useState<number>(initialScore && initialScore >= 1 && initialScore <= 5 ? initialScore : 5);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(event.currentTarget);
    formData.set("score", String(score));

    startTransition(async () => {
      const result = await rateStartup(formData);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
      <input type="hidden" name="startupId" value={startupId} />
      <label className="block text-[11px] font-medium text-muted-foreground">Rate this startup</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScore(value)}
            className="rounded-md border border-border/60 px-2 py-1 text-[11px] hover:bg-accent"
            aria-label={`Set ${value} star rating`}
          >
            <span className="inline-flex items-center gap-1">
              {value}
              <Star className={`h-3 w-3 ${score >= value ? "fill-amber-300 text-amber-300" : "text-muted-foreground"}`} />
            </span>
          </button>
        ))}
      </div>
      <textarea
        name="note"
        rows={2}
        maxLength={400}
        placeholder="Optional note about traction, execution, or market fit"
        className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      {saved ? <p className="text-[11px] text-emerald-300">Saved.</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] text-cyan-200 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {isPending ? "Saving..." : "Submit rating"}
      </button>
    </form>
  );
}
