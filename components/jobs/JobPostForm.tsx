"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createJobPost } from "@/app/actions/jobs";

type ProjectOption = { id: string; name: string };

export function JobPostForm({ projects, defaultCompany }: { projects: ProjectOption[]; defaultCompany?: string }) {
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
          const result = await createJobPost(data);
          if (result.success) {
            setSuccess(true);
            form.reset();
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="title" required placeholder="Role title" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
        <input name="company" required defaultValue={defaultCompany ?? ""} placeholder="Company" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
      </div>
      <textarea
        name="description"
        required
        rows={4}
        placeholder="Role description"
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select name="roleType" defaultValue="FULL_TIME" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="FREELANCE">Freelance</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="COFOUNDER">Co-founder</option>
        </select>
        <select name="locationType" defaultValue="REMOTE" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">Onsite</option>
        </select>
        <select name="status" defaultValue="OPEN" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="OPEN">Open</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="chainFocus" placeholder="Chain focus (optional)" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
        <input name="compensation" placeholder="Compensation (optional)" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
        <select name="projectId" defaultValue="" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="">Linked project (optional)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <input
        name="skillsRequired"
        required
        placeholder="Skills required (comma-separated)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      />
      {success ? <p className="text-sm text-emerald-300">Job post created.</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Creating..." : "Create Job Post"}
      </button>
    </form>
  );
}
