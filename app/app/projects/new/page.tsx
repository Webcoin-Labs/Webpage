"use client";

import { useTransition, useState } from "react";
import { createProject } from "@/app/actions/project";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const stages = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "LIVE", label: "Live" },
];

export default function NewProjectPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createProject(formData);
      if (result.success) router.push("/app/projects");
      else setError(result.error);
    });
  };

  return (
    <div className="max-w-lg py-8">
      <h1 className="mb-2 text-2xl font-bold">New Project</h1>
      <p className="mb-8 text-muted-foreground">Create a project profile to share with the Webcoin Labs team.</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border/50 bg-card p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Tagline</label>
          <input
            name="tagline"
            maxLength={100}
            placeholder="One-line description..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Description</label>
          <textarea
            name="description"
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Chain Focus</label>
            <input
              name="chainFocus"
              placeholder="Base, Ethereum, Solana..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Stage</label>
            <select
              name="stage"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Website</label>
            <input
              name="websiteUrl"
              type="url"
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">GitHub</label>
            <input
              name="githubUrl"
              type="url"
              placeholder="https://github.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
