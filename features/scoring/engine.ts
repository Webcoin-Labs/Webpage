import "server-only";

import type { ScoreExplanation, ScoreFactor, ScoreLabel } from "@/server/services/contracts";

export function labelFromScore(score: number): ScoreLabel {
  if (score >= 75) return "strong";
  if (score >= 45) return "moderate";
  return "missing";
}

export function factorStatus(value: number): ScoreLabel {
  if (value >= 0.75) return "strong";
  if (value >= 0.45) return "moderate";
  return "missing";
}

export function buildScoreExplanation(input: {
  factors: Array<Omit<ScoreFactor, "status">>;
  sourceVersion: string;
}): ScoreExplanation {
  const totalWeight = input.factors.reduce((acc, factor) => acc + factor.weight, 0) || 1;
  const weightedValue = input.factors.reduce((acc, factor) => acc + factor.value * factor.weight, 0);
  const normalized = Math.max(0, Math.min(1, weightedValue / totalWeight));
  const score = Math.round(normalized * 100);
  return {
    score,
    label: labelFromScore(score),
    factors: input.factors.map((factor) => ({
      ...factor,
      status: factorStatus(factor.value),
    })),
    lastComputedAt: new Date().toISOString(),
    sourceVersion: input.sourceVersion,
  };
}

