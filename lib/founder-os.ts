import { BadgeType, StartupChainFocus } from "@prisma/client";

const BADGE_KEYWORDS: Record<BadgeType, string[]> = {
  ARC_DEVELOPER: ["arc", "arcpay", "arcpay", "stablecoin", "circle"],
  SOLANA_DEVELOPER: ["solana", "anchor", "spl-token", "metaplex"],
  ETHEREUM_DEVELOPER: ["ethereum", "evm", "hardhat", "ethers", "openzeppelin"],
  BASE_BUILDER: ["base", "basechain", "coinbase"],
};

const TECH_STACK_KEYWORDS = [
  "nextjs",
  "react",
  "typescript",
  "solana",
  "ethereum",
  "base",
  "rust",
  "node",
  "prisma",
  "postgres",
];

export function buildStartupSlug(name: string) {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized.slice(0, 64) || "startup";
}

export function parseRepoName(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1].replace(/\.git$/i, "")}`;
    }
  } catch {
    // no-op
  }
  return repoUrl.replace(/^https?:\/\//i, "");
}

export function detectTechStackFromText(text: string) {
  const lower = text.toLowerCase();
  return TECH_STACK_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function detectBadgesFromText(text: string): BadgeType[] {
  const lower = text.toLowerCase();
  return (Object.entries(BADGE_KEYWORDS) as Array<[BadgeType, string[]]>)
    .filter(([, keywords]) => keywords.some((keyword) => lower.includes(keyword)))
    .map(([badgeType]) => badgeType);
}

export function normalizeChain(chain?: string | null): StartupChainFocus {
  const value = String(chain ?? "").trim().toLowerCase();
  if (value === "solana") return "SOLANA";
  if (value === "base") return "BASE";
  if (value === "ethereum") return "ETHEREUM";
  return "ARC";
}

export function calculateCofounderMatchScore(input: {
  preferredRole?: string | null;
  skillsNeeded?: string[];
  roleTitle?: string | null;
  builderSkills?: string[];
  builderOpenTo?: string[];
  builderBio?: string | null;
}) {
  let score = 0;
  const reasons: string[] = [];

  const preferredRole = (input.preferredRole ?? "").toLowerCase();
  const roleTitle = (input.roleTitle ?? "").toLowerCase();
  if (preferredRole && roleTitle && (roleTitle.includes(preferredRole) || preferredRole.includes(roleTitle))) {
    score += 25;
    reasons.push("Role preference aligns");
  }

  const skillsNeeded = (input.skillsNeeded ?? []).map((skill) => skill.toLowerCase());
  const builderSkills = (input.builderSkills ?? []).map((skill) => skill.toLowerCase());
  const sharedSkills = skillsNeeded.filter((skill) => builderSkills.some((builderSkill) => builderSkill.includes(skill)));
  if (sharedSkills.length > 0) {
    score += Math.min(40, sharedSkills.length * 12);
    reasons.push(`Shared skills: ${sharedSkills.slice(0, 3).join(", ")}`);
  }

  const openToText = (input.builderOpenTo ?? []).join(" ").toLowerCase();
  if (/co-?founder|startup|early|mvp|full/i.test(openToText)) {
    score += 15;
    reasons.push("Open to startup collaboration");
  }

  const bio = (input.builderBio ?? "").toLowerCase();
  if (/ownership|founder|0-1|build/i.test(bio)) {
    score += 10;
    reasons.push("Founder-style motivation signal");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons: reasons.slice(0, 3),
  };
}
