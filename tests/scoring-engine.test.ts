import { describe, expect, test } from "vitest";
import { buildScoreExplanation, labelFromScore } from "@/features/scoring/engine";

describe("scoring engine", () => {
  test("calculates weighted score and label", () => {
    const result = buildScoreExplanation({
      sourceVersion: "test-v1",
      factors: [
        { key: "a", label: "A", weight: 1, value: 1, reason: "ok" },
        { key: "b", label: "B", weight: 1, value: 0.5, reason: "partial" },
      ],
    });

    expect(result.score).toBe(75);
    expect(result.label).toBe("strong");
    expect(result.factors).toHaveLength(2);
    expect(result.sourceVersion).toBe("test-v1");
  });

  test("maps score labels deterministically", () => {
    expect(labelFromScore(76)).toBe("strong");
    expect(labelFromScore(50)).toBe("moderate");
    expect(labelFromScore(44)).toBe("missing");
  });
});

