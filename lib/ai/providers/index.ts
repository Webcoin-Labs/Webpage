import { GeminiPitchAnalysisProvider } from "@/lib/ai/providers/gemini";
import { type AnalyzePitchDeckInput, type AnalyzePitchDeckResult, type PitchAnalysisProvider } from "@/lib/ai/providers/types";

export function getPitchAnalysisProvider(): PitchAnalysisProvider {
  // Provider swap point for future adapters.
  return new GeminiPitchAnalysisProvider();
}

export async function analyzePitchDeckWithProvider(
  input: AnalyzePitchDeckInput
): Promise<AnalyzePitchDeckResult> {
  const provider = getPitchAnalysisProvider();
  return provider.analyze(input);
}

export type { PitchReportOutput } from "@/lib/ai/providers/types";
