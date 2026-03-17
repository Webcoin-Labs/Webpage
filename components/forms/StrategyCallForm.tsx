"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitStrategyCall } from "@/app/actions/lead";

export function StrategyCallForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await submitStrategyCall(data);
      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        </div>
        <p className="text-lg font-semibold text-foreground">Strategy call request submitted</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We will review your project context and reach out shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-12 rounded-3xl border border-border bg-black/90 p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        name="name"
        required
        className="rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground"
        placeholder="Full Name"
      />
      <input
        name="email"
        required
        type="email"
        className="rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground"
        placeholder="Email"
      />
      <input
        name="contactHandle"
        className="rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground"
        placeholder="WhatsApp / Telegram (optional)"
      />
      <input
        name="projectName"
        required
        className="rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground"
        placeholder="Project Name"
      />
      <input
        name="stage"
        required
        className="rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground"
        placeholder="Project Stage"
      />
      <textarea
        name="description"
        required
        className="md:col-span-2 rounded-lg border border-border bg-black px-4 py-3 text-sm text-foreground min-h-[120px]"
        placeholder="Describe your project"
      />
      {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="md:col-span-2 mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/90 transition disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Submitting..." : "Book My Call"}
      </button>
    </form>
  );
}
