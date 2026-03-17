type FounderLike = {
  chainFocus?: string | null;
  currentNeeds?: string[];
  projectStage?: string | null;
  companyDescription?: string | null;
};

type BuilderLike = {
  title?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  preferredChains: string[];
  openTo: string[];
  interests: string[];
};

type ProjectLike = {
  name: string;
  stage: string;
  chainFocus?: string | null;
  description?: string | null;
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

function includesLoose(list: string[], value: string) {
  const normalized = value.toLowerCase().trim();
  return list.some((item) => item.toLowerCase().includes(normalized) || normalized.includes(item.toLowerCase()));
}

function tokenize(text?: string | null): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2);
}

export function scoreFounderToBuilder(founder: FounderLike, builder: BuilderLike): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const founderChains = founder.chainFocus ? founder.chainFocus.split(",").map((x) => x.trim()).filter(Boolean) : [];
  const needs = founder.currentNeeds ?? [];
  const builderSkills = builder.skills ?? [];
  const builderChains = builder.preferredChains ?? [];
  const builderOpenTo = builder.openTo ?? [];

  if (founderChains.some((chain) => includesLoose(builderChains, chain))) {
    score += 30;
    reasons.push("Matches your chain focus");
  }

  const needSkillHit = needs.some((need) => includesLoose(builderSkills, need) || includesLoose(builder.interests, need));
  if (needSkillHit) {
    score += 30;
    reasons.push("Relevant skillset for your current needs");
  }

  if (builderOpenTo.some((x) => /co-?founder|full|contract|contributor|project/i.test(x))) {
    score += 15;
    reasons.push("Open to active collaboration");
  }

  if (founder.projectStage && /IDEA|MVP/i.test(founder.projectStage) && builderOpenTo.some((x) => /early|mvp|startup|co-?founder/i.test(x))) {
    score += 10;
    reasons.push("Open to early-stage collaboration");
  }

  const founderTokens = tokenize(founder.companyDescription);
  const builderTokens = tokenize([builder.title, builder.headline, builder.bio].filter(Boolean).join(" "));
  const overlap = founderTokens.filter((t) => builderTokens.includes(t));
  if (overlap.length > 0) {
    score += Math.min(15, overlap.length * 3);
    reasons.push("Experience appears aligned with your project focus");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.slice(0, 3),
  };
}

export function scoreBuilderToProject(builder: BuilderLike, project: ProjectLike): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (project.chainFocus && includesLoose(builder.preferredChains, project.chainFocus)) {
    score += 35;
    reasons.push("Matches your preferred chain focus");
  }

  const combinedProjectText = `${project.name} ${project.description ?? ""}`.toLowerCase();
  const skillHit = builder.skills.some((s) => combinedProjectText.includes(s.toLowerCase()));
  if (skillHit) {
    score += 30;
    reasons.push("Your skills are relevant to this project");
  }

  if (/IDEA|MVP/i.test(project.stage) && builder.openTo.some((x) => /co-?founder|startup|mvp|early/i.test(x))) {
    score += 15;
    reasons.push("Open to this project stage");
  }

  const interestsHit = builder.interests.some((i) => combinedProjectText.includes(i.toLowerCase()));
  if (interestsHit) {
    score += 10;
    reasons.push("Aligned with your interests");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.slice(0, 3),
  };
}
