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

function safeDisplayValue(value: string) {
  if (!value) return "-";
  if (value.includes("Ã") || value.includes("â")) return "-";
  return value;
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
    <div className="w-full space-y-6 xl:mx-auto xl:w-[min(1800px,calc(100vw-23rem))] xl:max-w-none">

      {/* â”€â”€â”€ PAGE HEADER â”€â”€â”€ */}
      <section
        className="rounded-[20px] p-6"
        style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#a78bfa" }}>
              Pitch Deck Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold" style={{ color: "#e4e4e7", letterSpacing: "-0.3px" }}>
              Investor-grade pitch deck builder
            </h1>
            <p className="mt-1.5 text-[13px] leading-6" style={{ color: "#71717a" }}>
              Analyze a real deck, surface weak sections, and improve the narrative with score-led guidance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-[12px]"
              style={{
                borderColor: isPremium ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)",
                backgroundColor: isPremium ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)",
                color: isPremium ? "#34d399" : "#fbbf24",
              }}
            >
              {isPremium ? <Sparkles className="mr-1.5 h-3 w-3" /> : <Crown className="mr-1.5 h-3 w-3" />}
              {isPremium ? "Pro unlocked" : "Pro locked"}
            </div>
            <button
              type="button"
              onClick={onReanalyzeDeck}
              disabled={pending || !activeDeck}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40"
              style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#71717a" }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", pending ? "animate-spin" : "")} />
              Re-analyze
            </button>
            <button
              type="button"
              onClick={() => onExport("pdf")}
              disabled={!activeDeck || exporting === "pdf"}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40"
              style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
            >
              {exporting === "pdf" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* Upload row + score cards */}
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          {/* Upload card */}
          <div
            className="rounded-[14px] p-4 space-y-4"
            style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeDeck?.id ?? ""}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="min-w-[200px] rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ border: "0.5px solid #27272a", backgroundColor: "#111114", color: "#d4d4d8" }}
              >
                {decks.length ? (
                  decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>{deck.originalFileName}</option>
                  ))
                ) : (
                  <option value="">No pitch decks yet</option>
                )}
              </select>
              {[
                `Upload ${activeDeck?.uploadStatus ?? "N/A"}`,
                `Processing ${activeDeck?.processingStatus ?? "N/A"}`,
                `Versions ${activeDeck?.versions.length ?? 0}`,
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full px-2.5 py-1 text-[10px]"
                  style={{ border: "0.5px solid #27272a", color: "#52525b" }}
                >
                  {label}
                </span>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUploadSubmit(e.currentTarget);
              }}
              className="space-y-3"
            >
              {projects.length > 0 ? (
                <select
                  name="projectId"
                  defaultValue=""
                  className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                  style={{ border: "0.5px solid #27272a", backgroundColor: "#111114", color: "#d4d4d8" }}
                >
                  <option value="">Attach to project (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              ) : null}
              <label
                className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3.5 text-[13px] transition-colors"
                style={{ border: "0.5px dashed #27272a", backgroundColor: "#111114", color: "#71717a" }}
              >
                <UploadCloud className="h-4 w-4 shrink-0" style={{ color: "#a78bfa" }} />
                Upload PDF to generate a deck review, slide-by-slide feedback, and rewrite suggestions.
                <input type="file" name="file" accept=".pdf,.docx" required className="hidden" />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-medium transition-colors disabled:opacity-50"
                style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
              >
                {pending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                Upload and analyze
              </button>
            </form>
          </div>

          {/* Score cards â€” stacked vertically */}
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {scoreCards.map((card) => (
              <div
                key={card.label}
                className={cn("rounded-[14px] border p-4", scoreTone(card.value))}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60">{card.label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-4xl font-bold tabular-nums">{card.value ?? "--"}</p>
                  <span
                    className="mb-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: card.value == null ? "transparent"
                        : card.value >= 70 ? "rgba(16,185,129,0.15)"
                        : card.value >= 45 ? "rgba(251,191,36,0.15)"
                        : "rgba(239,68,68,0.15)",
                      color: card.value == null ? "inherit"
                        : card.value >= 70 ? "#34d399"
                        : card.value >= 45 ? "#fbbf24"
                        : "#f87171",
                    }}
                  >
                    {card.value == null ? "N/A" : card.value >= 70 ? "Strong" : card.value >= 45 ? "Moderate" : "Needs work"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] opacity-50 leading-4">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ WORKSPACE TABS â”€â”€â”€ */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className="shrink-0 rounded-lg px-4 py-2 text-[12px] font-medium capitalize transition-colors"
            style={{
              backgroundColor: tab === item ? "#1a1030" : "transparent",
              color: tab === item ? "#a78bfa" : "#52525b",
              border: `0.5px solid ${tab === item ? "#4c1d95" : "transparent"}`,
            }}
          >
            {item.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* â”€â”€â”€ 3-COLUMN WORKSPACE â”€â”€â”€ */}
      <div className="grid gap-6 2xl:gap-8 xl:grid-cols-[300px_minmax(900px,1fr)_360px]">

        {/* â”€â”€ LEFT: Slide Navigator â”€â”€ */}
        <aside
          className="self-start rounded-[16px] p-4 xl:sticky xl:top-24 xl:h-fit space-y-4"
          style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>
                Slide Navigator
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ border: "0.5px solid #27272a", color: "#52525b" }}
              >
                {filteredSections.length}/{activeDeck?.sections.length ?? 0}
              </span>
            </div>

            {/* Filter pills */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                { key: "ALL", label: "All" },
                { key: "WEAK_OR_UNDER", label: "Weak+" },
                { key: "MISSING_ONLY", label: "Missing" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSectionFilter(item.key as SectionFilter)}
                  className="rounded-lg py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: sectionFilter === item.key ? "#1a1030" : "#0d0d0f",
                    border: `0.5px solid ${sectionFilter === item.key ? "#4c1d95" : "#27272a"}`,
                    color: sectionFilter === item.key ? "#a78bfa" : "#52525b",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Status badges */}
            <div className="mt-2.5 flex gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[10px]"
                style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}
              >
                Weak {weakCount}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[10px]"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              >
                Missing {missingCount}
              </span>
            </div>
          </div>

          {/* Section list */}
          <div className="space-y-1.5">
            {filteredSections.length ? (
              filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors"
                  style={{
                    border: `0.5px solid ${selectedSection?.id === section.id ? "#4c1d95" : "#1e1e24"}`,
                    backgroundColor: selectedSection?.id === section.id ? "#1a1030" : "transparent",
                  }}
                >
                  <p
                    className="text-[12px] font-medium"
                    style={{ color: selectedSection?.id === section.id ? "#a78bfa" : "#d4d4d8" }}
                  >
                    {section.sectionTitle}
                  </p>
                  <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px]", qualityTone(section.qualityLabel))}>
                    {section.qualityLabel}
                  </span>
                </button>
              ))
            ) : (
              <p
                className="rounded-xl px-3 py-3 text-[12px]"
                style={{ border: "0.5px solid #1e1e24", color: "#52525b" }}
              >
                No sections in this filter. Try switching to All.
              </p>
            )}
          </div>
        </aside>

        {/* â”€â”€ CENTER: Deck Canvas â”€â”€ */}
        <main className="min-w-0 space-y-4">
          {/* Canvas header */}
          <div
            className="rounded-[16px] p-5"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Deck canvas</p>
                <h2 className="mt-1 text-[18px] font-semibold" style={{ color: "#e4e4e7", letterSpacing: "-0.2px" }}>
                  {selectedSection?.sectionTitle ?? "Deck overview"}
                </h2>
                <p className="mt-0.5 text-[12px]" style={{ color: "#52525b" }}>
                  {selectedSection
                    ? `Slide ${selectedSectionIndex + 1} of ${activeDeck?.sections.length ?? 0} Â· edit-ready feedback and investor signal checks`
                    : "Use the navigator to open a section, inspect gaps, and rewrite copy where it matters."}
                </p>
              </div>
              {selectedSection ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectNeighborSection("prev")}
                    disabled={selectedSectionIndex <= 0}
                    className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#71717a" }}
                    aria-label="Previous slide"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectNeighborSection("next")}
                    disabled={!activeDeck || selectedSectionIndex >= activeDeck.sections.length - 1}
                    className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#71717a" }}
                    aria-label="Next slide"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px]", qualityTone(selectedSection.qualityLabel))}>
                    {selectedSection.qualityLabel}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Status banners */}
          {!activeDeck ? (
            <div
              className="rounded-[16px] p-5"
              style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
            >
              <p className="text-[14px] font-semibold" style={{ color: "#e4e4e7" }}>No pitch decks yet</p>
              <p className="mt-1 text-[13px]" style={{ color: "#71717a" }}>
                Upload your first PDF deck to begin analysis.
              </p>
            </div>
          ) : null}

          {deckIsAnalyzing ? (
            <div
              className="rounded-[16px] p-4"
              style={{ backgroundColor: "rgba(96,165,250,0.06)", border: "0.5px solid rgba(96,165,250,0.2)" }}
            >
              <div className="flex items-center gap-2" style={{ color: "#60a5fa" }}>
                <RefreshCw className={cn("h-4 w-4", pending ? "animate-spin" : "")} />
                <p className="text-[13px] font-medium">Analysis in progress</p>
              </div>
              <p className="mt-1 text-[12px]" style={{ color: "rgba(96,165,250,0.6)" }}>
                Current status: {activeDeck?.processingStatus}. Results load automatically when complete.
              </p>
            </div>
          ) : null}

          {/* â”€â”€ TAB CONTENT â”€â”€ */}

          {/* OVERVIEW TAB */}
          {tab === "overview" ? (
            <div className="space-y-4">
              {activeReport ? (
                <>
                  {/* Score cards row */}
                  <div className="grid gap-4 xl:grid-cols-3">
                    {scoreCards.map((card) => (
                      <div
                        key={card.label}
                        className={cn("rounded-[14px] border p-5", scoreTone(card.value))}
                      >
                        <p className="text-[10px] uppercase tracking-[0.16em] opacity-60">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums">{card.value ?? "--"}</p>
                        <p className="mt-2 max-w-[30ch] text-[11px] leading-5 opacity-60">{card.note}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strengths / Risks / Next Steps */}
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div
                      className="rounded-[14px] p-5 space-y-2.5"
                      style={{ backgroundColor: "rgba(16,185,129,0.05)", border: "0.5px solid rgba(16,185,129,0.2)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#34d399" }}>
                        Strengths
                      </p>
                      <ul className="space-y-2">
                        {asStringArray(activeReport.strengths).slice(0, 5).map((point, idx) => (
                          <li key={`s-${idx}`} className="flex items-start gap-2 text-[12px] leading-6" style={{ color: "#a1a1aa" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#34d399" }} />
                            {point}
                          </li>
                        ))}
                        {asStringArray(activeReport.strengths).length === 0 && (
                          <li className="text-[12px]" style={{ color: "#3f3f46" }}>No strengths reported.</li>
                        )}
                      </ul>
                    </div>
                    <div
                      className="rounded-[14px] p-5 space-y-2.5"
                      style={{ backgroundColor: "rgba(251,191,36,0.05)", border: "0.5px solid rgba(251,191,36,0.2)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#fbbf24" }}>
                        Risks
                      </p>
                      <ul className="space-y-2">
                        {asStringArray(activeReport.risks).slice(0, 5).map((point, idx) => (
                          <li key={`r-${idx}`} className="flex items-start gap-2 text-[12px] leading-6" style={{ color: "#a1a1aa" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
                            {point}
                          </li>
                        ))}
                        {asStringArray(activeReport.risks).length === 0 && (
                          <li className="text-[12px]" style={{ color: "#3f3f46" }}>No risks identified.</li>
                        )}
                      </ul>
                    </div>
                    <div
                      className="rounded-[14px] p-5 space-y-2.5"
                      style={{ backgroundColor: "rgba(167,139,250,0.05)", border: "0.5px solid rgba(167,139,250,0.2)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#a78bfa" }}>
                        Next steps
                      </p>
                      <ul className="space-y-2">
                        {asStringArray(activeReport.nextSteps).slice(0, 5).map((point, idx) => (
                          <li key={`n-${idx}`} className="flex items-start gap-2 text-[12px] leading-6" style={{ color: "#a1a1aa" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#a78bfa" }} />
                            {point}
                          </li>
                        ))}
                        {asStringArray(activeReport.nextSteps).length === 0 && (
                          <li className="text-[12px]" style={{ color: "#3f3f46" }}>No next steps generated.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="rounded-[16px] p-8 text-center"
                  style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
                >
                  <p className="text-[14px] font-semibold" style={{ color: "#d4d4d8" }}>No analysis report yet</p>
                  <p className="mt-1 text-[13px]" style={{ color: "#71717a" }}>
                    Upload and analyze a deck to unlock scorecards, weaknesses, and next-step guidance.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* ANALYSIS TAB */}
          {tab === "analysis" ? (
            <div className="space-y-3">
              <div
                className="rounded-[16px] p-5"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Section health</p>
                {activeDeck?.sections.length ? (
                  <div className="mt-3 space-y-2">
                    {activeDeck.sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-xl px-4 py-3"
                        style={{ border: "0.5px solid #1e1e24", backgroundColor: "#0d0d0f" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium" style={{ color: "#d4d4d8" }}>
                            {section.sectionTitle}
                          </span>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", qualityTone(section.qualityLabel))}>
                            {section.qualityLabel}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[12px]" style={{ color: "#71717a" }}>
                          {section.fixSummary ?? "No summary generated."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[13px]" style={{ color: "#71717a" }}>Analyze a deck to see section health.</p>
                )}
              </div>
              <div
                className="rounded-[16px] p-5"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Missing sections</p>
                {missingSections.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingSections.map((key) => (
                      <span
                        key={key}
                        className="rounded-full px-2.5 py-1 text-[11px]"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[13px]" style={{ color: "#71717a" }}>No hard-missing sections detected.</p>
                )}
              </div>
            </div>
          ) : null}

          {/* SLIDES TAB */}
          {tab === "slides" ? (
            <div
              className="rounded-[16px] p-5"
              style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
            >
              {selectedSection ? (
                <div className="space-y-4">
                  <p className="whitespace-pre-wrap text-[13px] leading-6" style={{ color: "#a1a1aa" }}>
                    {selectedSection.extractedText}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div
                      className="rounded-xl p-4"
                      style={{ backgroundColor: "rgba(16,185,129,0.05)", border: "0.5px solid rgba(16,185,129,0.2)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#34d399" }}>
                        What is good
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {asStringArray(selectedSection.goodPoints).map((point, idx) => (
                          <li key={`g-${idx}`} className="flex items-start gap-2 text-[12px] leading-5" style={{ color: "#a1a1aa" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#34d399" }} />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className="rounded-xl p-4"
                      style={{ backgroundColor: "rgba(251,191,36,0.05)", border: "0.5px solid rgba(251,191,36,0.2)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#fbbf24" }}>
                        What is unclear
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {asStringArray(selectedSection.unclearPoints).map((point, idx) => (
                          <li key={`u-${idx}`} className="flex items-start gap-2 text-[12px] leading-5" style={{ color: "#a1a1aa" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: "#71717a" }}>No section selected.</p>
              )}
            </div>
          ) : null}

          {/* AI FIXES TAB */}
          {tab === "ai-fixes" ? (
            <div className="space-y-3">
              {!isPremium ? (
                <PremiumLockCard
                  title="Fix weak slides with Pro"
                  description="Unlock section rewrites, missing slide generation, investor-language optimization, and full improved deck versions."
                />
              ) : (
                <>
                  <div
                    className="rounded-[16px] p-5 space-y-4"
                    style={{ backgroundColor: "rgba(167,139,250,0.05)", border: "0.5px solid rgba(167,139,250,0.2)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Rewrite selected section</p>
                        <p className="mt-0.5 text-[12px]" style={{ color: "#71717a" }}>
                          Assistive rewrite only. The model does not invent metrics or founder facts outside uploaded data.
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
                        style={{ backgroundColor: "rgba(167,139,250,0.1)", border: "0.5px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}
                      >
                        <WandSparkles className="h-3 w-3" />
                        AI rewrite
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                          className="rounded-full px-3 py-1.5 text-[11px] transition-colors"
                          style={{
                            border: `0.5px solid ${tone === preset ? "#4c1d95" : "#27272a"}`,
                            backgroundColor: tone === preset ? "#1a1040" : "transparent",
                            color: tone === preset ? "#a78bfa" : "#71717a",
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
                        style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#d4d4d8" }}
                        placeholder="Tone guidance"
                      />
                      <button
                        type="button"
                        onClick={onRewriteSection}
                        disabled={pending || !selectedSection}
                        className="rounded-xl px-4 py-2 text-[12px] font-medium transition-colors disabled:opacity-40"
                        style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
                      >
                        Rewrite section
                      </button>
                    </div>
                  </div>
                  <div
                    className="rounded-[16px] p-5"
                    style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Generate missing sections</p>
                    {missingSections.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {missingSections.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onGenerateMissing(key)}
                            className="rounded-xl px-3 py-1.5 text-[12px] transition-colors"
                            style={{ border: "0.5px solid #27272a", color: "#71717a" }}
                          >
                            Generate {key}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[13px]" style={{ color: "#71717a" }}>No missing sections currently detected.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {/* COMPARE TAB */}
          {tab === "compare" ? (
            <div
              className="rounded-[16px] p-5 space-y-4"
              style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Compare versions</p>
                <select
                  value={selectedVersion?.id ?? ""}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-[12px] outline-none"
                  style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#d4d4d8" }}
                >
                  {activeDeck?.versions.map((version) => (
                    <option key={version.id} value={version.id}>{version.name}</option>
                  ))}
                </select>
              </div>
              {selectedVersion ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ border: "0.5px solid #27272a", color: "#52525b" }}>
                      Version: {selectedVersion.versionType}
                    </span>
                    {compareInsights ? (
                      <>
                        <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ border: "0.5px solid #27272a", color: "#52525b" }}>
                          Before {compareInsights.beforeLen} chars
                        </span>
                        <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ border: "0.5px solid #27272a", color: "#52525b" }}>
                          After {compareInsights.afterLen} chars
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px]"
                          style={{
                            border: `0.5px solid ${compareInsights.delta >= 0 ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.3)"}`,
                            backgroundColor: compareInsights.delta >= 0 ? "rgba(16,185,129,0.08)" : "rgba(251,191,36,0.08)",
                            color: compareInsights.delta >= 0 ? "#34d399" : "#fbbf24",
                          }}
                        >
                          Delta {compareInsights.delta >= 0 ? "+" : ""}{compareInsights.delta}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl p-4" style={{ border: "0.5px solid #1e1e24", backgroundColor: "#0d0d0f" }}>
                      <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#52525b" }}>Original</p>
                      <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5" style={{ color: "#71717a" }}>
                        {selectedSection?.extractedText ?? "No original section selected."}
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-4"
                      style={{ backgroundColor: "rgba(167,139,250,0.05)", border: "0.5px solid rgba(167,139,250,0.2)" }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#a78bfa" }}>Improved (AI-assisted)</p>
                      <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5" style={{ color: "#71717a" }}>
                        {selectedImprovedText || "This version does not include a section-scoped rewrite for the current slide."}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: "#71717a" }}>No saved versions yet.</p>
              )}
            </div>
          ) : null}

          {/* EXPORT TAB */}
          {tab === "export" ? (
            <div
              className="rounded-[16px] p-5 space-y-4"
              style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
            >
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Export workspace artifacts</p>
                <p className="mt-1 text-[12px]" style={{ color: "#71717a" }}>
                  Exports include only stored analysis, section reviews, and saved versions. No synthetic KPIs or invented founder data are added.
                </p>
              </div>
              {activeDeck ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { format: "pdf" as ExportFormat, icon: <Download className="h-4 w-4" />, label: "PDF" },
                    { format: "summary" as ExportFormat, icon: <FileText className="h-4 w-4" />, label: "Summary" },
                    { format: "json" as ExportFormat, icon: <History className="h-4 w-4" />, label: "JSON" },
                  ].map(({ format, icon, label }) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => onExport(format)}
                      disabled={exporting === format}
                      className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] transition-colors disabled:opacity-40"
                      style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#a1a1aa" }}
                    >
                      {exporting === format ? <RefreshCw className="h-4 w-4 animate-spin" /> : icon}
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: "#71717a" }}>Upload and analyze a deck before exporting.</p>
              )}
            </div>
          ) : null}

          {/* Error / success */}
          {error ? <p className="rounded-xl px-4 py-2.5 text-[13px]" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#f87171" }}>{error}</p> : null}
          {success ? <p className="rounded-xl px-4 py-2.5 text-[13px]" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "0.5px solid rgba(16,185,129,0.25)", color: "#34d399" }}>{success}</p> : null}
        </main>

        {/* â”€â”€ RIGHT: Deck Readiness Snapshot â”€â”€ */}
        <aside className="flex flex-col gap-4 self-start xl:sticky xl:top-24 xl:h-fit">
          <div
            className="rounded-[16px] p-5"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Deck Readiness</p>

            {/* Snapshot cards */}
            <div className="mt-4 space-y-2">
              {[
                { label: "Selected deck", value: activeDeck?.originalFileName ?? "No deck selected", accent: false },
                {
                  label: "Weak sections",
                  value: weakCount === 0 ? "All sections are solid" : `${weakCount} need stronger investor framing`,
                  accent: weakCount > 0,
                  accentColor: "#fbbf24",
                },
                {
                  label: "Missing sections",
                  value: missingCount === 0 ? "No critical gaps detected" : `${missingCount} critical sections absent`,
                  accent: missingCount > 0,
                  accentColor: "#f87171",
                },
                { label: "Versions saved", value: `${activeDeck?.versions.length ?? 0}` },
                { label: "Upload status", value: activeDeck?.uploadStatus ?? "â€”" },
                { label: "Processing", value: activeDeck?.processingStatus ?? "â€”" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl px-4 py-3"
                  style={{
                    border: `0.5px solid ${item.accent ? `${item.accentColor}30` : "#1e1e24"}`,
                    backgroundColor: item.accent ? `${item.accentColor}08` : "#0d0d0f",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#3f3f46" }}>{item.label}</p>
                  <p
                    className="mt-1 text-[13px] font-medium"
                    style={{ color: item.accent ? item.accentColor : "#d4d4d8" }}
                  >
                    {safeDisplayValue(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generation panel */}
          <div
            className="rounded-[16px] p-5 space-y-3"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>AI Generation</p>
            <p className="text-[12px]" style={{ color: "#71717a" }}>
              Use AI after you inspect scores and weak slides, not before.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onGenerateImprovedVersion}
                disabled={!isPremium || pending || !activeDeck}
                className="w-full rounded-xl py-2.5 text-[12px] font-medium transition-colors disabled:opacity-40"
                style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
              >
                Generate improved deck
              </button>
              <button
                type="button"
                onClick={onGenerateStartupDraft}
                disabled={!isPremium || pending || !activeDeck}
                className="w-full rounded-xl py-2.5 text-[12px] font-medium transition-colors disabled:opacity-40"
                style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#71717a" }}
              >
                Generate startup draft
              </button>
            </div>
            {!isPremium ? (
              <div
                className="rounded-xl px-3 py-2.5 text-[11px]"
                style={{ backgroundColor: "rgba(251,191,36,0.06)", border: "0.5px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
              >
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Premium required for generation.
                </span>
              </div>
            ) : null}
          </div>

          {/* Version history panel */}
          <div
            className="rounded-[16px] p-5 space-y-3"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Version History</p>
            {activeDeck?.versions.length ? (
              <div className="space-y-1.5">
                {activeDeck.versions.slice(0, 8).map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => setSelectedVersionId(version.id)}
                    className="w-full rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      border: `0.5px solid ${selectedVersion?.id === version.id ? "#4c1d95" : "#1e1e24"}`,
                      backgroundColor: selectedVersion?.id === version.id ? "#1a1030" : "#0d0d0f",
                    }}
                  >
                    <p className="text-[12px] font-medium" style={{ color: selectedVersion?.id === version.id ? "#a78bfa" : "#d4d4d8" }}>
                      {version.name}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "#52525b" }}>
                      {String(version.versionType)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: "#71717a" }}>No versions saved yet.</p>
            )}
          </div>

          {/* Export shortcuts */}
          <div
            className="rounded-[16px] p-5 space-y-3"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#52525b" }}>Export & Handoff</p>
            <div className="grid gap-2">
              {[
                { format: "pdf" as ExportFormat, icon: <Download className="h-3.5 w-3.5" />, label: "Export PDF" },
                { format: "summary" as ExportFormat, icon: <FileText className="h-3.5 w-3.5" />, label: "Export summary" },
                { format: "json" as ExportFormat, icon: <History className="h-3.5 w-3.5" />, label: "Export JSON" },
              ].map(({ format, icon, label }) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => onExport(format)}
                  disabled={!activeDeck || exporting === format}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] transition-colors disabled:opacity-40"
                  style={{ border: "0.5px solid #27272a", backgroundColor: "#0d0d0f", color: "#71717a" }}
                >
                  {exporting === format ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : icon}
                  {label}
                </button>
              ))}
            </div>
            {!isPremium ? (
              <div className="mt-1">
                <PremiumLockCard
                  title="Generate stronger investor copy"
                  description="Unlock section-level rewrite, missing section generation, and startup-data-based deck drafts."
                />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
