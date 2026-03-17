"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { applyToJob } from "@/app/actions/jobs";

export function JobApplyForm({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (success) {
    return <p className="text-xs text-emerald-300">Application submitted.</p>;
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs font-medium hover:bg-cyan-500/20"
        >
          Apply
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            const data = new FormData(e.currentTarget);
            data.set("jobId", jobId);
            startTransition(async () => {
              const result = await applyToJob(data);
              if (result.success) {
                setSuccess(true);
              } else {
                setError(result.error);
              }
            });
          }}
          className="space-y-2"
        >
          <textarea
            name="message"
            rows={3}
            required
            placeholder="Why are you a good fit?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
          />
          <input
            name="resumeUrl"
            placeholder="Resume/portfolio URL (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-70"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Submit
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
