"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitJobsWaitlist } from "@/app/actions/lead";

export function JobsWaitlistForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await submitJobsWaitlist(data);
          if (result.success) {
            setSuccess(true);
            e.currentTarget.reset();
          } else {
            setError(result.error);
          }
        });
      }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Jobs updates</p>
        <h3 className="text-2xl font-semibold mt-3">Looking for blockchain jobs?</h3>
        <p className="text-sm text-muted-foreground mt-2">Get notified when founder-backed opportunities are posted.</p>
      </div>
      <div className="flex w-full md:w-auto flex-col gap-2">
        <div className="flex gap-2">
          <input
            required
            type="email"
            name="email"
            className="min-w-[220px] rounded-full border border-border bg-background px-4 py-2 text-sm"
            placeholder="your@email.com"
          />
          <input
            name="roleInterest"
            className="hidden lg:block min-w-[180px] rounded-full border border-border bg-background px-4 py-2 text-sm"
            placeholder="Role interest (optional)"
          />
        </div>
        {success ? <p className="text-xs text-emerald-300">You are on the jobs waitlist.</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-3 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-500/90 transition disabled:opacity-70 inline-flex items-center gap-2"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Submitting..." : "Notify me"}
      </button>
    </form>
  );
}
