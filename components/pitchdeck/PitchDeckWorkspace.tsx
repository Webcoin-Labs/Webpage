"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Download,
  FileText,
  History,
  Lock,
  RefreshCw,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { PitchDeckVersionType, PitchSectionQuality } from "@prisma/client";
import {
  generateImprovedPitchDeckVersionAction,
  generateMissingPitchSectionAction,
  generateStartupDraftPitchDeckAction,
  retryPitchDeckAnalysis,
  rewritePitchDeckSectionAction,
  submitPitchDeck,
} from "@/app/actions/pitchdeck";
import { cn } from "@/lib/utils";

type DeckSection = {
  id: string;
  sectionKey: string;
  sectionTitle: string;
  sectionOrder: number;
  extractedText: string;
  qualityLabel: PitchSectionQuality;
  goodPoints: unknown;
  unclearPoints: unknown;
  missingPoints: unknown;
  fixSummary: string | null;
};

type DeckVersion = {
  id: string;
  name: string;
  versionType: PitchDeckVersionType;
  contentJson: unknown;
  createdAt: Date | string;
};

type DeckReport = {
  id: string;
  status: string;
  clarityScore: number | null;
  completenessScore: number | null;
  investorReadinessScore: number | null;
  missingInformation: unknown;
  strengths: unknown;
  risks: unknown;
  nextSteps: unknown;
  updatedAt: Date | string;
};

export type DeckRecord = {
  id: string;
  originalFileName: string;
  processingStatus: string;
  uploadStatus: string;
  createdAt: Date | string;
  project?: { id: string; name: string } | null;
  sections: DeckSection[];
  versions: DeckVersion[];
  reports: DeckReport[];
};

const tabs = ["overview", "analysis", "slides", "ai-fixes", "compare", "export"] as const;
type WorkspaceTab = (typeof tabs)[number];
type SectionFilter = "ALL" | "WEAK_OR_UNDER" | "MISSING_ONLY";
type ExportFormat = "pdf" | "json" | "summary";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function qualityTone(quality: PitchSectionQuality) {
  if (quality === "STRONG") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  if (quality === "MODERATE") return "text-blue-300 border-blue-500/30 bg-blue-500/10";
  if (quality === "WEAK" || quality === "UNDERDEVELOPED") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-rose-300 border-rose-500/30 bg-rose-500/10";
}

function isWeakOrUnder(quality: PitchSectionQuality) {
  return quality === "WEAK" || quality === "UNDERDEVELOPED";
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => stringifyUnknown(item)).filter(Boolean).join("\n\n");
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["content", "text", "body", "summary", "rewrittenCopy", "narrative", "slideText"]) {
      const candidate = obj[key];
      if (!candidate) continue;
      const rendered = stringifyUnknown(candidate);
      if (rendered) return rendered;
    }
    return JSON.stringify(value, null, 2);
  }
  return "";
}

function normalized(value: string) {
  return value.toLowerCase().trim();
}

function extractImprovedTextForSection(version: DeckVersion | undefined, section: DeckSection | undefined): string {
  if (!version || !section || !version.contentJson || typeof version.contentJson !== "object") return "";
  const content = version.contentJson as Record<string, unknown>;
  const action = typeof content.action === "string" ? content.action : "";

  if (action === "rewrite-section") {
    const sourceSectionId = typeof content.sourceSectionId === "string" ? content.sourceSectionId : "";
    if (sourceSectionId && sourceSectionId !== section.id) return "";
    return stringifyUnknown(content.rewritten);
  }

  if (action === "generate-missing-section") {
    const generated = content.generated;
    if (generated && typeof generated === "object") {
      const generatedObj = generated as Record<string, unknown>;
      const sectionTitle = typeof generatedObj.sectionTitle === "string" ? generatedObj.sectionTitle : "";
      if (sectionTitle && normalized(sectionTitle) !== normalized(section.sectionTitle)) return "";
      return stringifyUnknown(generatedObj);
    }
  }

  const sections = Array.isArray(content.sections) ? content.sections : [];
  if (sections.length > 0) {
    const found = sections.find((item) => {
      if (!item || typeof item !== "object") return false;
      const node = item as Record<string, unknown>;
      const title = typeof node.sectionTitle === "string" ? node.sectionTitle : typeof node.title === "string" ? node.title : "";
      const key = typeof node.sectionKey === "string" ? node.sectionKey : typeof node.key === "string" ? node.key : "";
      return normalized(title) === normalized(section.sectionTitle) || normalized(key) === normalized(section.sectionKey);
    });
    if (found) return stringifyUnknown(found);
  }

  return stringifyUnknown(content).slice(0, 4000);
}

function scoreTone(score: number | null | undefined) {
  if (typeof score !== "number") return "border-border/60 bg-background text-muted-foreground";
  if (score >= 80) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (score >= 65) return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  if (score >= 50) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-rose-500/30 bg-rose-500/10 text-rose-200";
}

function PremiumLockCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4">
      <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
        <Crown className="h-3 w-3" />
        Pro
      </div>
      <p className="mt-2 text-sm font-medium text-amber-200">{title}</p>
      <p className="mt-1 text-xs text-amber-100/80">{description}</p>
      <Link
        href="/app/kols-premium"
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
      >
        Unlock premium workspace
      </Link>
    </div>
  );
}

export function PitchDeckWorkspace({
  isPremium,
  decks,
  projects,
}: {
  isPremium: boolean;
  decks: DeckRecord[];
  projects: Array<{ id: string; name: string }>;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id ?? "");
  const [selectedSectionId, setSelectedSectionId] = useState<string>(decks[0]?.sections[0]?.id ?? "");
  const [selectedVersionId, setSelectedVersionId] = useState<string>(decks[0]?.versions[0]?.id ?? "");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("ALL");
  const [tone, setTone] = useState("sharper investor language");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const activeDeck = useMemo(() => decks.find((deck) => deck.id === activeDeckId) ?? decks[0], [decks, activeDeckId]);
  const activeReport = activeDeck?.reports[0] ?? null;
  const selectedSection = activeDeck?.sections.find((section) => section.id === selectedSectionId) ?? activeDeck?.sections[0];
  const selectedVersion = activeDeck?.versions.find((version) => version.id === selectedVersionId) ?? activeDeck?.versions[0];
  const selectedSectionIndex = activeDeck?.sections.findIndex((section) => section.id === selectedSection?.id) ?? -1;
  const selectedImprovedText = useMemo(
    () => extractImprovedTextForSection(selectedVersion, selectedSection),
    [selectedVersion, selectedSection],
  );
  const compareInsights = useMemo(() => {
    const before = selectedSection?.extractedText ?? "";
    const after = selectedImprovedText;
    if (!before || !after) return null;
    const beforeLen = before.trim().length;
    const afterLen = after.trim().length;
    const delta = afterLen - beforeLen;
    return { beforeLen, afterLen, delta };
  }, [selectedSection?.extractedText, selectedImprovedText]);

  const missingSections = useMemo(
    () => {
      if (!activeDeck) return [];
      const detectedMissing = activeDeck.sections
        .filter((section) => section.qualityLabel === "MISSING")
        .map((section) => section.sectionKey);
      const originalVersion = activeDeck.versions.find((version) => version.versionType === "ORIGINAL");
      const versionMissing = Array.isArray((originalVersion?.contentJson as { missingSections?: unknown[] } | undefined)?.missingSections)
        ? ((originalVersion?.contentJson as { missingSections?: unknown[] }).missingSections ?? []).map((item) => String(item))
        : [];
      return Array.from(new Set([...detectedMissing, ...versionMissing]));
    },
    [activeDeck],
  );
  const filteredSections = useMemo(() => {
    if (!activeDeck) return [];
    if (sectionFilter === "MISSING_ONLY") return activeDeck.sections.filter((section) => section.qualityLabel === "MISSING");
    if (sectionFilter === "WEAK_OR_UNDER") {
      return activeDeck.sections.filter((section) => isWeakOrUnder(section.qualityLabel) || section.qualityLabel === "MISSING");
    }
    return activeDeck.sections;
  }, [activeDeck, sectionFilter]);
  const weakCount = useMemo(
    () => activeDeck?.sections.filter((section) => isWeakOrUnder(section.qualityLabel)).length ?? 0,
    [activeDeck],
  );
  const missingCount = useMemo(
    () => activeDeck?.sections.filter((section) => section.qualityLabel === "MISSING").length ?? 0,
    [activeDeck],
  );
  const deckIsAnalyzing = Boolean(activeDeck && activeDeck.processingStatus !== "COMPLETED");

  function onUploadSubmit(form: HTMLFormElement) {
    setError("");
    setSuccess("");
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await submitPitchDeck(formData);
      if (result.success) {
        setSuccess("Deck uploaded and queued for analysis. Refresh after processing finishes.");
      } else {
        setError(result.error);
      }
    });
  }

  function onRewriteSection() {
    if (!activeDeck || !selectedSection) return;
    setError("");
    setSuccess("");
    const fd = new FormData();
    fd.set("pitchDeckId", activeDeck.id);
    fd.set("sectionId", selectedSection.id);
    fd.set("tone", tone);
    startTransition(async () => {
      const result = await rewritePitchDeckSectionAction(fd);
      if (result.success) setSuccess("Section rewrite generated and saved as a new version.");
      else setError(result.error);
    });
  }

  function onGenerateMissing(sectionKey: string) {
    if (!activeDeck) return;
    const fd = new FormData();
    fd.set("pitchDeckId", activeDeck.id);
    fd.set("sectionKey", sectionKey);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await generateMissingPitchSectionAction(fd);
      if (result.success) setSuccess(`Generated ${sectionKey} draft and saved as a new version.`);
      else setError(result.error);
    });
  }

  function onGenerateImprovedVersion() {
    if (!activeDeck) return;
    const fd = new FormData();
    fd.set("pitchDeckId", activeDeck.id);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await generateImprovedPitchDeckVersionAction(fd);
      if (result.success) setSuccess("Improved deck version generated.");
      else setError(result.error);
    });
  }

  function onReanalyzeDeck() {
    if (!activeDeck) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await retryPitchDeckAnalysis(activeDeck.id);
      if (result.success) setSuccess("Deck re-analysis started.");
      else setError(result.error);
    });
  }

  function onGenerateStartupDraft() {
    if (!activeDeck) return;
    const fd = new FormData();
    fd.set("pitchDeckId", activeDeck.id);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await generateStartupDraftPitchDeckAction(fd);
      if (result.success) setSuccess("Startup-based deck draft generated.");
      else setError(result.error);
    });
  }

  function onSelectDeck(deckId: string) {
    setActiveDeckId(deckId);
    const nextDeck = decks.find((deck) => deck.id === deckId);
    setSelectedSectionId(nextDeck?.sections[0]?.id ?? "");
    setSelectedVersionId(nextDeck?.versions[0]?.id ?? "");
  }

  function selectNeighborSection(direction: "prev" | "next") {
    if (!activeDeck?.sections.length || selectedSectionIndex < 0) return;
    const nextIndex =
      direction === "prev"
        ? Math.max(0, selectedSectionIndex - 1)
        : Math.min(activeDeck.sections.length - 1, selectedSectionIndex + 1);
    setSelectedSectionId(activeDeck.sections[nextIndex]?.id ?? "");
  }

  function onExport(format: ExportFormat) {
    if (!activeDeck) return;
    setExporting(format);
    const versionPart = selectedVersion ? `&versionId=${selectedVersion.id}` : "";
    window.location.href = `/api/pitchdeck/${activeDeck.id}/export?format=${format}${versionPart}`;
    window.setTimeout(() => setExporting(null), 1200);
  }

  const scoreCards = [
    {
      label: "Clarity score",
      value: activeReport?.clarityScore ?? null,
      note: "How clearly the story lands in one read.",
    },
    {
      label: "Completeness score",
      value: activeReport?.completenessScore ?? null,
      note: "Coverage across the core investor deck sections.",
    },
    {
      label: "Investor readiness",
      value: activeReport?.investorReadinessScore ?? null,
      note: "How close the deck is to a credible outbound send.",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border/60 bg-card/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Pitch Deck Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">Investor-grade pitch deck builder</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Analyze a real deck, surface weak sections, and improve the narrative with score-led guidance instead of a cluttered tool panel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1.5 text-xs",
                isPremium ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200",
              )}
            >
              {isPremium ? <Sparkles className="mr-1 h-3.5 w-3.5" /> : <Crown className="mr-1 h-3.5 w-3.5" />}
              {isPremium ? "Pro unlocked" : "Pro locked"}
            </div>
            <button
              type="button"
              onClick={onReanalyzeDeck}
              disabled={pending || !activeDeck}
              className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", pending ? "animate-spin" : "")} />
              Re-analyze
            </button>
            <button
              type="button"
              onClick={() => onExport("pdf")}
              disabled={!activeDeck || exporting === "pdf"}
              className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
            >
              {exporting === "pdf" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeDeck?.id ?? ""}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {decks.length ? (
                  decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.originalFileName}
                    </option>
                  ))
                ) : (
                  <option value="">No pitch decks yet</option>
                )}
              </select>
              <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                Upload {activeDeck?.uploadStatus ?? "N/A"}
              </span>
              <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                Processing {activeDeck?.processingStatus ?? "N/A"}
              </span>
              <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                Versions {activeDeck?.versions.length ?? 0}
              </span>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                onUploadSubmit(e.currentTarget);
              }}
            >
              {projects.length > 0 ? (
                <select name="projectId" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" defaultValue="">
                  <option value="">Attach to project (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background px-4 py-4 text-sm text-muted-foreground">
                <UploadCloud className="h-4 w-4 text-cyan-300" />
                Upload PDF to generate a deck review, slide-by-slide feedback, and rewrite suggestions.
                <input type="file" name="file" accept=".pdf,.docx" required className="hidden" />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
              >
                {pending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                Upload and analyze
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {scoreCards.map((card) => (
              <div key={card.label} className={cn("rounded-2xl border p-4", scoreTone(card.value))}>
                <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value ?? "--"}</p>
                <p className="mt-2 text-xs opacity-80">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Slide navigator</p>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              {filteredSections.length}/{activeDeck?.sections.length ?? 0}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {[
              { key: "ALL", label: "All" },
              { key: "WEAK_OR_UNDER", label: "Weak+" },
              { key: "MISSING_ONLY", label: "Missing" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSectionFilter(item.key as SectionFilter)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px]",
                  sectionFilter === item.key
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                    : "border-border/60 bg-background text-muted-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
              Weak {weakCount}
            </span>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
              Missing {missingCount}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {filteredSections.length ? (
              filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left text-xs",
                    selectedSection?.id === section.id
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                      : "border-border/60 bg-background text-muted-foreground",
                  )}
                >
                  <p className="font-medium">{section.sectionTitle}</p>
                  <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px]", qualityTone(section.qualityLabel))}>
                    {section.qualityLabel}
                  </span>
                </button>
              ))
            ) : (
              <p className="rounded-md border border-border/60 bg-background p-2 text-xs text-muted-foreground">
                No sections in this filter. Try switching to All.
              </p>
            )}
          </div>
        </aside>

        <main className="space-y-4">
          {!activeDeck ? (
            <section className="rounded-[24px] border border-border/60 bg-card p-6">
              <p className="text-sm font-semibold">No pitch decks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your first PDF deck to begin analysis. The workspace will then unlock slide-level diagnosis, compare, and exports.
              </p>
            </section>
          ) : null}

          {deckIsAnalyzing ? (
            <section className="rounded-[24px] border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 text-cyan-200">
                <RefreshCw className={cn("h-4 w-4", pending ? "animate-spin" : "")} />
                <p className="text-sm font-medium">Analysis in progress</p>
              </div>
              <p className="mt-1 text-xs text-cyan-100/80">
                Current status: {activeDeck.processingStatus}. This workspace only displays extracted deck text and generated guidance from your stored data.
              </p>
            </section>
          ) : null}

          <section className="rounded-[24px] border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Deck canvas</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {selectedSection?.sectionTitle ?? "Deck overview"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedSection
                    ? `Slide ${selectedSectionIndex + 1} of ${activeDeck?.sections.length ?? 0} with edit-ready feedback and investor signal checks.`
                    : "Use the navigator to open a section, inspect gaps, and rewrite copy where it matters."}
                </p>
              </div>
              {selectedSection ? (
                <div className={cn("rounded-full border px-3 py-1 text-xs", qualityTone(selectedSection.qualityLabel))}>
                  {selectedSection.qualityLabel}
                </div>
              ) : null}
            </div>

          {tab === "overview" ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold">Executive summary</p>
                {activeReport ? (
                  <div className="mt-3 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {scoreCards.map((card) => (
                        <div key={card.label} className={cn("rounded-xl border px-3 py-3", scoreTone(card.value))}>
                          <p className="text-[11px] uppercase tracking-[0.14em] opacity-80">{card.label}</p>
                          <p className="mt-2 text-2xl font-semibold">{card.value ?? "--"}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-emerald-300">Strengths</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {asStringArray(activeReport.strengths).slice(0, 4).map((point, idx) => (
                            <li key={`${point}-${idx}`}>- {point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-300">Risks</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {asStringArray(activeReport.risks).slice(0, 4).map((point, idx) => (
                            <li key={`${point}-${idx}`}>- {point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-cyan-300">Next steps</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {asStringArray(activeReport.nextSteps).slice(0, 4).map((point, idx) => (
                            <li key={`${point}-${idx}`}>- {point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No analysis report yet. Upload and analyze a deck to unlock scorecards, weaknesses, and next-step guidance.
                  </p>
                )}
              </section>
              <section className="rounded-xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold">Deck readiness snapshot</p>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border/60 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Selected deck</p>
                    <p className="mt-2 font-medium text-foreground">{activeDeck?.originalFileName ?? "No deck selected"}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Weak sections</p>
                    <p className="mt-2">{weakCount} sections need stronger investor framing or sharper evidence.</p>
                  </div>
                  <div className="rounded-xl border border-border/60 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Missing sections</p>
                    <p className="mt-2">{missingCount} critical sections are still absent or incomplete.</p>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "analysis" ? (
            <div className="space-y-4">
              <section className="rounded-xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold">Section health</p>
                {activeDeck?.sections.length ? (
                  <div className="mt-2 space-y-2">
                    {activeDeck.sections.map((section) => (
                      <div key={section.id} className="rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span>{section.sectionTitle}</span>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", qualityTone(section.qualityLabel))}>
                            {section.qualityLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs">{section.fixSummary ?? "No summary generated."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Analyze a deck to see section health.</p>
                )}
              </section>
              <section className="rounded-xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold">Missing sections</p>
                {missingSections.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingSections.map((key) => (
                      <span key={key} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300">
                        {key}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No hard-missing sections detected.</p>
                )}
              </section>
            </div>
          ) : null}

          {tab === "slides" ? (
            <section className="rounded-xl border border-border/60 bg-background p-4">
              {selectedSection ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{selectedSection.sectionTitle}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Slide {selectedSectionIndex + 1} of {activeDeck?.sections.length ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectNeighborSection("prev")}
                        disabled={selectedSectionIndex <= 0}
                        className="rounded-md border border-border/60 bg-background p-1.5 text-muted-foreground disabled:opacity-40"
                        aria-label="Previous slide"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => selectNeighborSection("next")}
                        disabled={!activeDeck || selectedSectionIndex >= activeDeck.sections.length - 1}
                        className="rounded-md border border-border/60 bg-background p-1.5 text-muted-foreground disabled:opacity-40"
                        aria-label="Next slide"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", qualityTone(selectedSection.qualityLabel))}>
                        {selectedSection.qualityLabel}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedSection.extractedText}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-emerald-300">What is good</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {asStringArray(selectedSection.goodPoints).map((point, idx) => (
                          <li key={`${point}-${idx}`}>- {point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-300">What is unclear</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {asStringArray(selectedSection.unclearPoints).map((point, idx) => (
                          <li key={`${point}-${idx}`}>- {point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No section selected.</p>
              )}
            </section>
          ) : null}

          {tab === "ai-fixes" ? (
            <section className="space-y-4">
              {!isPremium ? (
                <PremiumLockCard
                  title="Fix weak slides with Pro"
                  description="Unlock section rewrites, missing slide generation, investor-language optimization, and full improved deck versions."
                />
              ) : (
                <>
                  <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-background to-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Rewrite selected section</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Assistive rewrite only. The model does not invent metrics or founder facts outside uploaded data.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200">
                        <WandSparkles className="h-3 w-3" />
                        AI rewrite
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "sharper investor language",
                        "clearer problem-solution flow",
                        "more concise and confident",
                        "traction-first narrative",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTone(preset)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px]",
                            tone === preset
                              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                              : "border-border/60 bg-background text-muted-foreground",
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:max-w-sm"
                        placeholder="Tone guidance"
                      />
                      <button
                        type="button"
                        onClick={onRewriteSection}
                        disabled={pending || !selectedSection}
                        className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
                      >
                        Rewrite section
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="text-sm font-semibold">Generate missing sections</p>
                    {missingSections.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {missingSections.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onGenerateMissing(key)}
                            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Generate {key}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No missing sections currently detected.</p>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {tab === "compare" ? (
            <section className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Compare versions</p>
                <select
                  value={selectedVersion?.id ?? ""}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  {activeDeck?.versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedVersion ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full border border-border/60 px-2 py-0.5">Version type: {selectedVersion.versionType}</span>
                    {compareInsights ? (
                      <>
                        <span className="rounded-full border border-border/60 px-2 py-0.5">Before {compareInsights.beforeLen} chars</span>
                        <span className="rounded-full border border-border/60 px-2 py-0.5">After {compareInsights.afterLen} chars</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5",
                            compareInsights.delta >= 0
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                          )}
                        >
                          Delta {compareInsights.delta >= 0 ? "+" : ""}
                          {compareInsights.delta}
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-border/60 px-2 py-0.5">
                        No section-specific compare available for this version
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Original</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {selectedSection?.extractedText ?? "No original section selected."}
                      </p>
                    </div>
                    <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-cyan-300">Improved (AI-assisted)</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {selectedImprovedText || "This version does not include a section-scoped rewrite for the current slide."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No saved versions yet.</p>
              )}
            </section>
          ) : null}

          {tab === "export" ? (
            <section className="rounded-xl border border-border/60 bg-background p-4">
              <p className="text-sm font-semibold">Export workspace artifacts</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Exports include only stored analysis, section reviews, and saved versions. No synthetic KPIs or invented founder data are added.
              </p>
              {activeDeck ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onExport("pdf")}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={exporting === "pdf"}
                  >
                    {exporting === "pdf" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onExport("summary")}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={exporting === "summary"}
                  >
                    {exporting === "summary" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => onExport("json")}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={exporting === "json"}
                  >
                    {exporting === "json" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
                    JSON
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Upload and analyze a deck before exporting.</p>
              )}
            </section>
          ) : null}
          </section>

          <section className="rounded-[24px] border border-border/60 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Workspace modes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep tools below the main deck so the analysis and copy stay visible.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs capitalize",
                      tab === item
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                        : "border-border/60 bg-background text-muted-foreground",
                    )}
                  >
                    {item.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        </main>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <section className="rounded-[24px] border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">AI generation</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Use AI after you inspect scores and weak slides, not before. This keeps the workspace closer to a professional builder workflow.
          </p>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={onGenerateImprovedVersion}
              disabled={!isPremium || pending || !activeDeck}
              className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate improved deck
            </button>
            <button
              type="button"
              onClick={onGenerateStartupDraft}
              disabled={!isPremium || pending || !activeDeck}
              className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate startup-based draft
            </button>
          </div>
          {!isPremium ? (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Premium required for rewrite and generation.
              </p>
              <p className="mt-1 text-amber-100/80">Free plan keeps upload, analysis, compare, and export access.</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Version history</p>
          <div className="mt-3 space-y-2">
            {activeDeck?.versions.length ? (
              activeDeck.versions.slice(0, 8).map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left text-xs",
                    selectedVersion?.id === version.id
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                      : "border-border/60 bg-background text-muted-foreground",
                  )}
                >
                  <p>{version.name}</p>
                  <p className="mt-1 text-[10px] opacity-80">{String(version.versionType)}</p>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No versions saved yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Export and handoff</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Package the current deck review for founders, advisors, or investors without adding synthetic claims.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => onExport("pdf")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              disabled={!activeDeck || exporting === "pdf"}
            >
              {exporting === "pdf" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => onExport("summary")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              disabled={!activeDeck || exporting === "summary"}
            >
              {exporting === "summary" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export summary
            </button>
            <button
              type="button"
              onClick={() => onExport("json")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              disabled={!activeDeck || exporting === "json"}
            >
              {exporting === "json" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              Export JSON
            </button>
          </div>
          {!isPremium ? (
            <div className="mt-4">
              <PremiumLockCard
                title="Generate stronger investor copy"
                description="Unlock section-level rewrite, missing section generation, and startup-data-based deck drafts."
              />
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}

