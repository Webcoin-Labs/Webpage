"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitKreatorboardWaitlist } from "@/app/actions/lead";

export function KreatorboardWaitlistForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        const form = e.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = await submitKreatorboardWaitlist(data);
          if (result.success) {
            setSuccess(true);
            form.reset();
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          required
          name="name"
          placeholder="Your name"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          name="email"
          placeholder="you@company.com"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <input
        name="projectName"
        placeholder="Project name (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <textarea
        name="useCase"
        placeholder="How would you use Kreatorboard? (optional)"
        className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      {success ? <p className="text-xs text-emerald-300">You are on the Kreatorboard waitlist.</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-500/90 disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Submitting..." : "Join waitlist"}
      </button>
    </form>
  );
}
