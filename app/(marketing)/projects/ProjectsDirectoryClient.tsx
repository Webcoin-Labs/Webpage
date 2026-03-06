"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import type { Project, User } from "@prisma/client";

type ProjectWithOwner = Project & { owner: Pick<User, "id" | "name"> };

const STAGES = ["IDEA", "MVP", "LIVE"] as const;
const STAGE_LABELS: Record<string, string> = { IDEA: "Idea", MVP: "MVP", LIVE: "Live" };

export function ProjectsDirectoryClient({ initialProjects }: { initialProjects: ProjectWithOwner[] }) {
  const [stageFilter, setStageFilter] = useState<string>("");
  const [chainFilter, setChainFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const chains = useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => p.chainFocus && set.add(p.chainFocus));
    return Array.from(set).sort();
  }, [initialProjects]);

  const filtered = useMemo(() => {
    return initialProjects.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = p.name.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.chainFocus?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (stageFilter && p.stage !== stageFilter) return false;
      if (chainFilter && p.chainFocus !== chainFilter) return false;
      return true;
    });
  }, [initialProjects, search, stageFilter, chainFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="">All chains</option>
            {chains.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project, i) => (
          <AnimatedSection key={project.id} delay={i * 0.03}>
            <Link
              href={project.slug ? `/projects/${project.slug}` : `/projects/${project.id}`}
              className="block p-6 rounded-xl border border-border/50 bg-card hover:border-violet-500/30 hover:bg-accent/20 transition-all h-full"
            >
              <h2 className="font-semibold text-lg mb-1">{project.name}</h2>
              {project.tagline && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.tagline}</p>}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  project.stage === "LIVE" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                  project.stage === "MVP" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {STAGE_LABELS[project.stage]}
                </span>
                {project.chainFocus && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{project.chainFocus}</span>
                )}
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No projects match your filters.
        </div>
      )}
    </div>
  );
}
