"use client";

import { useTransition, useState } from "react";
import { createOrUpdatePartner } from "@/app/actions/admin";
import type { Partner } from "@prisma/client";
import { Loader2, CheckCircle2, Pencil } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  VC: "VC", CEX: "CEX", LAUNCHPAD: "Launchpad", GUILD: "Guild", MEDIA: "Media", PORTFOLIO: "Portfolio",
};

export function AdminPartnersForm({
  categories,
  existing,
}: { categories: readonly string[]; existing?: Partner | null }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!existing);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    if (existing) formData.set("id", existing.id);
    startTransition(async () => {
      try {
        await createOrUpdatePartner(formData);
        setSuccess(true);
        if (!existing) (e.target as HTMLFormElement).reset();
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  if (existing && !editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border/50 bg-card">
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input name="name" defaultValue={existing?.name} required className="w-40 px-2 py-1.5 rounded border border-border bg-background text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Category</label>
        <select name="category" defaultValue={existing?.category} className="px-2 py-1.5 rounded border border-border bg-background text-sm">
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Status</label>
        <select name="status" defaultValue={existing?.status} className="px-2 py-1.5 rounded border border-border bg-background text-sm">
          <option value="CURRENT">Current</option>
          <option value="LEGACY">Legacy</option>
        </select>
      </div>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" name="featured" defaultChecked={existing?.featured} className="rounded" />
        Featured
      </label>
      <div>
        <label className="block text-xs font-medium mb-1">URL</label>
        <input name="url" type="url" defaultValue={existing?.url ?? ""} placeholder="https://..." className="w-48 px-2 py-1.5 rounded border border-border bg-background text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Logo path</label>
        <input name="logoPath" defaultValue={existing?.logoPath ?? ""} placeholder="/network/current/name.png" className="w-48 px-2 py-1.5 rounded border border-border bg-background text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Sort</label>
        <input name="sortOrder" type="number" defaultValue={existing?.sortOrder ?? 0} className="w-16 px-2 py-1.5 rounded border border-border bg-background text-sm" />
      </div>
      {error && <p className="text-xs text-destructive w-full">{error}</p>}
      {success && <span className="text-xs text-cyan-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
      <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 disabled:opacity-60">
        {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        {existing ? "Update" : "Add"}
      </button>
      {existing && <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>}
    </form>
  );
}
