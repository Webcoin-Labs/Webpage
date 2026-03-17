"use client";

import { useState } from "react";
import { submitDeckWaitlist } from "@/app/actions/deck-waitlist";

export function PitchDeckHubClient() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitDeckWaitlist(formData);
    setPending(false);
    if (result.success) setSuccess(true);
    else setError(result.error);
  }

  if (success) {
    return (
      <p className="text-sm text-emerald-300 font-medium">
        You&apos;re on the list. We&apos;ll notify you when the deck is available.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Get deck updates"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
