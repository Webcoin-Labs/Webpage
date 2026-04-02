"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  Github,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  previewGithubRepository,
  type BuilderProjectResult,
} from "@/app/actions/builder-projects";

type GithubConnectionSummary = {
  username: string;
  profileUrl?: string | null;
} | null;

type Props = {
  githubConnection: GithubConnectionSummary;
  saveAction: (formData: FormData) => Promise<BuilderProjectResult>;
};

type ImportedRepo = {
  title: string;
  tagline: string;
  description: string;
  githubUrl: string;
  liveUrl: string;
  techStack: string;
  achievements: string;
  openSourceContributions: string;
};

const initialFields = {
  title: "",
  tagline: "",
  description: "",
  imageUrl: "",
  githubUrl: "",
  liveUrl: "",
  techStack: "",
  achievements: "",
  openSourceContributions: "",
};

function buildImportNote(importedRepo: ImportedRepo | null) {
  if (!importedRepo) return "Paste a GitHub repo URL and Webcoin Labs will prefill the project details.";
  return "Imported fields are editable. Tighten the story around your contribution before saving.";
}

export function BuilderProjectManager({
  githubConnection,
  saveAction,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState(initialFields);
  const [importedRepo, setImportedRepo] = useState<ImportedRepo | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, startImport] = useTransition();
  const [submitState, setSubmitState] = useState<BuilderProjectResult | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const connectionLabel = useMemo(() => {
    if (!githubConnection) return "GitHub not connected";
    return `Connected as @${githubConnection.username}`;
  }, [githubConnection]);

  const setField = (key: keyof typeof initialFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const handleImport = () => {
    const repoUrl = fields.githubUrl.trim();
    setImportError(null);
    startImport(async () => {
      const result = await previewGithubRepository(repoUrl);
      if (!result.success) {
        setImportError(result.error);
        return;
      }
      const nextFields = {
        ...fields,
        title: result.data.title || fields.title,
        tagline: result.data.tagline || fields.tagline,
        description: result.data.description || fields.description,
        githubUrl: result.data.githubUrl || fields.githubUrl,
        liveUrl: result.data.liveUrl || fields.liveUrl,
        techStack: result.data.techStack || fields.techStack,
        achievements: result.data.achievements || fields.achievements,
        openSourceContributions:
          result.data.openSourceContributions || fields.openSourceContributions,
      };
      setFields(nextFields);
      setImportedRepo(result.data);
      setImportError(null);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSubmit(async () => {
      setSubmitState(null);
      const formData = new FormData(formRef.current ?? undefined);
      const result = await saveAction(formData).catch((error: unknown): BuilderProjectResult => ({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not save the project right now.",
        }));
      setSubmitState(result);
      if (result.success) {
        setFields(initialFields);
        setImportedRepo(null);
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Project Manager</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect GitHub, paste a repo URL, and let Webcoin Labs prefill the
            project before you refine the outcome narrative.
          </p>
        </div>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
          Builder automation
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border/60 bg-background/40 p-5"
        >
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                  <Github className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{connectionLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {githubConnection
                      ? "Use a connected repository URL to auto-fill title, stack, homepage, and open-source proof."
                      : "Connect GitHub first for a cleaner proof-of-work workflow and future repo sync."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {githubConnection?.profileUrl ? (
                  <Link
                    href={githubConnection.profileUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    View profile
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
                <Link
                  href="/app/builder-os/github"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
                >
                  {githubConnection ? "Manage GitHub" : "Connect GitHub"}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                GitHub repository URL
              </label>
              <input
                name="githubUrl"
                value={fields.githubUrl}
                onChange={(event) => setField("githubUrl", event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !fields.githubUrl.trim()}
              className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Import from GitHub
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{buildImportNote(importedRepo)}</p>
          {importError ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {importError}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Project title</label>
              <input
                name="title"
                required
                value={fields.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Shipyard, Chain Monitor, zk CLI..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">One-line summary</label>
              <input
                name="tagline"
                value={fields.tagline}
                onChange={(event) => setField("tagline", event.target.value)}
                placeholder="What this project does in one clean line"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Execution story</label>
            <textarea
              name="description"
              rows={5}
              value={fields.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Explain the user problem, the technical shape of the project, what shipped, and what you personally owned."
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Project image URL</label>
              <input
                name="imageUrl"
                value={fields.imageUrl}
                onChange={(event) => setField("imageUrl", event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Live or demo URL</label>
              <input
                name="liveUrl"
                value={fields.liveUrl}
                onChange={(event) => setField("liveUrl", event.target.value)}
                placeholder="https://demo..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tech stack</label>
            <input
              name="techStack"
              value={fields.techStack}
              onChange={(event) => setField("techStack", event.target.value)}
              placeholder="TypeScript, Next.js, Solidity, viem, PostgreSQL"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Outcomes and traction</label>
            <textarea
              name="achievements"
              rows={3}
              value={fields.achievements}
              onChange={(event) => setField("achievements", event.target.value)}
              placeholder="Users, stars, forks, audits, hackathon wins, throughput, adoption, revenue, or any proof that the work mattered."
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Open-source contribution detail</label>
            <textarea
              name="openSourceContributions"
              rows={3}
              value={fields.openSourceContributions}
              onChange={(event) => setField("openSourceContributions", event.target.value)}
              placeholder="Summarize merged PRs, repo ownership, maintainer responsibilities, or technical leadership."
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Use GitHub import first, then tighten the narrative in your own words.
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Save project
            </button>
          </div>

          {submitState?.success ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Project saved. It will appear below and in your Builder profile.
            </div>
          ) : null}
          {submitState && !submitState.success ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {submitState.error}
            </div>
          ) : null}
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border/60 bg-background/40 p-5">
            <p className="text-sm font-semibold">What GitHub import fills</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>Title and summary from repo identity.</p>
              <p>Homepage link when the repo exposes one.</p>
              <p>Tech stack from language and GitHub topics.</p>
              <p>Achievements from stars, forks, and watcher counts.</p>
              <p>Open-source proof from visibility, issues, and last push activity.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/40 p-5">
            <p className="text-sm font-semibold">Best practice</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Importing from GitHub should save time, not replace storytelling.
              Builders still need to explain their actual contribution, scope, and
              outcomes clearly for founders and hiring teams.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}
