"use client";

import { useTransition, useState } from "react";
import { createReward } from "@/app/actions/rewards";
import { Loader2, CheckCircle2 } from "lucide-react";

type UserOption = { id: string; name: string | null; email: string };

export function AdminRewardsForm({ users }: { users: UserOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createReward(formData);
      if (result.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-border/50 bg-card max-w-md space-y-4">
      <h2 className="font-semibold">Create reward</h2>
      <div>
        <label className="block text-xs font-medium mb-1.5">User <span className="text-destructive">*</span></label>
        <select name="userId" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name ?? u.email} ({u.email})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Label <span className="text-destructive">*</span></label>
        <input name="label" required placeholder="e.g. Monsterra token" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Amount (text) <span className="text-destructive">*</span></label>
        <input name="amountText" required placeholder="e.g. 100" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Telegram handle <span className="text-muted-foreground">(optional)</span></label>
        <input name="telegramHandle" placeholder="@handle" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-cyan-400">
          <CheckCircle2 className="w-4 h-4" /> Reward created.
        </div>
      )}
      <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 disabled:opacity-60">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Create reward
      </button>
    </form>
  );
}
