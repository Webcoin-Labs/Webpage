"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitHiringInterest } from "@/app/actions/hiring";

interface HiringInterestFormProps {
  founderId: string;
  founderLabel: string;
  initialName?: string;
  initialEmail?: string;
  compact?: boolean;
}

export function HiringInterestForm({
  founderId,
  founderLabel,
  initialName,
  initialEmail,
  compact = false,
}: HiringInterestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(!compact);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (success) {
    return (
      <p className="inline-flex items-center gap-2 text-xs text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Interest sent to {founderLabel}.
      </p>
    );
  }

  if (compact && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
      >
        Interested?
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);
        formData.set("founderId", founderId);
        startTransition(async () => {
          const result = await submitHiringInterest(formData);
          if (result.success) {
            setSuccess(true);
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-3"
    >
      <input type="hidden" name="founderId" value={founderId} />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          name="name"
          defaultValue={initialName}
          placeholder="Your name"
          required
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
        />
        <input
          name="email"
          type="email"
          defaultValue={initialEmail}
          placeholder="you@email.com"
          required
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
        />
      </div>
      <input
        name="skills"
        placeholder="Skills (comma-separated)"
        required
        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
      />
      <input
        name="portfolioUrl"
        type="url"
        placeholder="Portfolio / GitHub / LinkedIn / Website"
        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
      />
      <textarea
        name="message"
        required
        rows={3}
        placeholder="Short note about why you're a fit"
        className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-70"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isPending ? "Sending..." : "Send Interest"}
        </button>
        {compact ? (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
