import type { DeckType, PitchSectionQuality } from "@prisma/client";

export type ParsedDeckSection = {
  key: string;
  title: string;
  order: number;
  extractedText: string;
};

export type SectionReview = ParsedDeckSection & {
  qualityLabel: PitchSectionQuality;
  goodPoints: string[];
  unclearPoints: string[];
  missingPoints: string[];
  fixSummary: string;
};

const SECTION_HINTS: Array<{ key: string; title: string; hints: string[] }> = [
  { key: "cover", title: "Cover", hints: ["cover", "title", "vision"] },
  { key: "problem", title: "Problem", hints: ["problem", "pain", "challenge"] },
  { key: "solution", title: "Solution", hints: ["solution", "platform", "approach"] },
  { key: "product", title: "Product", hints: ["product", "demo", "feature"] },
  { key: "why-now", title: "Why now", hints: ["why now", "timing", "window"] },
  { key: "market", title: "Market", hints: ["market", "tam", "sam", "som", "opportunity"] },
  { key: "business-model", title: "Business model", hints: ["business model", "revenue", "pricing", "monetization"] },
  { key: "traction", title: "Traction", hints: ["traction", "growth", "users", "mrr", "arr", "kpi"] },
  { key: "gtm", title: "Go-to-market", hints: ["go to market", "gtm", "distribution", "acquisition"] },
  { key: "competition", title: "Competition", hints: ["competition", "competitor", "differentiation", "moat"] },
  { key: "team", title: "Team", hints: ["team", "founder", "leadership", "background"] },
  { key: "roadmap", title: "Roadmap", hints: ["roadmap", "milestone", "timeline"] },
  { key: "fundraising-ask", title: "Fundraising ask", hints: ["raising", "ask", "funding", "round", "use of funds"] },
  { key: "tokenomics", title: "Tokenomics", hints: ["tokenomics", "token", "utility", "allocation", "vesting"] },
];

function normalizeText(text: string) {
  return text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function splitIntoSlideChunks(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const formFeedSplit = normalized.split("\f").map((part) => part.trim()).filter(Boolean);
  if (formFeedSplit.length > 1) return formFeedSplit;

  const slideTagSplit = normalized
    .split(/\n(?=slide\s+\d+[:\-\s])/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (slideTagSplit.length > 1) return slideTagSplit;

  const paragraphSplit = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 50);
  if (paragraphSplit.length > 1) return paragraphSplit.slice(0, 24);

  return [normalized];
}

function inferSectionKey(text: string): { key: string; title: string } {
  const lower = text.toLowerCase();
  for (const section of SECTION_HINTS) {
    if (section.hints.some((hint) => lower.includes(hint))) {
      return { key: section.key, title: section.title };
    }
  }
  return { key: "general", title: "General section" };
}

function sectionQualityFromText(text: string): PitchSectionQuality {
  const len = text.trim().length;
  if (len <= 40) return "MISSING";
  if (len < 120) return "WEAK";
  if (len < 300) return "MODERATE";
  return "STRONG";
}

export function parseDeckSections(extractedText: string): ParsedDeckSection[] {
  const chunks = splitIntoSlideChunks(extractedText);
  return chunks.map((chunk, idx) => {
    const firstLine = chunk.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
    const inferred = inferSectionKey(`${firstLine}\n${chunk.slice(0, 220)}`);
    return {
      key: inferred.key,
      title: firstLine.length > 1 && firstLine.length < 100 ? firstLine : inferred.title,
      order: idx,
      extractedText: chunk.slice(0, 7000),
    };
  });
}

export function buildSectionReviews(extractedText: string): SectionReview[] {
  const parsed = parseDeckSections(extractedText);
  return parsed.map((section) => {
    const qualityLabel = sectionQualityFromText(section.extractedText);
    const hasNumbers = /\d/.test(section.extractedText);
    const hasOutcomeWords = /(result|growth|metric|revenue|user|adoption|retention)/i.test(section.extractedText);
    const goodPoints: string[] = [];
    const unclearPoints: string[] = [];
    const missingPoints: string[] = [];

    if (section.extractedText.length > 140) goodPoints.push("Section has enough content to communicate core context.");
    if (hasNumbers) goodPoints.push("Contains at least one measurable data point.");
    if (!hasNumbers) unclearPoints.push("Lacks concrete metrics or quantitative support.");
    if (!hasOutcomeWords) unclearPoints.push("Does not clearly communicate outcomes or proof of impact.");
    if (qualityLabel === "MISSING") missingPoints.push("Section content is effectively absent and needs founder input.");
    if (qualityLabel === "WEAK") missingPoints.push("Section is too brief and should include clearer narrative detail.");

    const fixSummary =
      qualityLabel === "STRONG"
        ? "Keep structure but tighten wording and investor ask clarity."
        : qualityLabel === "MODERATE"
          ? "Add sharper evidence, outcome framing, and concise investor-oriented language."
          : "Rebuild this section with explicit problem, evidence, and action-oriented narrative.";

    return {
      ...section,
      qualityLabel,
      goodPoints: goodPoints.length > 0 ? goodPoints : ["Needs stronger investor-facing specificity."],
      unclearPoints: unclearPoints.length > 0 ? unclearPoints : ["No major clarity issue detected."],
      missingPoints,
      fixSummary,
    };
  });
}

export function detectMissingSectionKeys(reviews: SectionReview[], deckType: DeckType | null): string[] {
  const required = [
    "problem",
    "solution",
    "market",
    "business-model",
    "traction",
    "gtm",
    "team",
    "fundraising-ask",
  ];
  const keys = new Set(reviews.map((r) => r.key));
  const missing = required.filter((key) => !keys.has(key));
  if (deckType === "web3" && !keys.has("tokenomics")) {
    missing.push("tokenomics");
  }
  return missing;
}

export function keyToSectionTitle(sectionKey: string): string {
  return SECTION_HINTS.find((section) => section.key === sectionKey)?.title ?? sectionKey;
}

