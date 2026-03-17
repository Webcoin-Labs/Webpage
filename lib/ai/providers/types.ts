import { z } from "zod";

export const pitchReportSchema = z.object({
  deckType: z.enum(["web3", "web2", "unclear"]),
  clarityScore: z.number().int().min(0).max(100),
  completenessScore: z.number().int().min(0).max(100),
  investorReadinessScore: z.number().int().min(0).max(100),
  problemSummary: z.string().min(1),
  solutionSummary: z.string().min(1),
  productThesis: z.string().min(1),
  targetCustomerSummary: z.string().min(1),
  marketPositioningSummary: z.string().min(1),
  businessModelSummary: z.string().min(1),
  tractionSummary: z.string().min(1),
  goToMarketSummary: z.string().min(1),
  tokenModelSummary: z.string().min(1),
  fundingReadinessNotes: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  gtmGaps: z.array(z.string().min(1)).min(1),
  risks: z.array(z.string().min(1)).min(1),
  nextSteps: z.array(z.string().min(1)).min(1),
  missingInformation: z.array(z.string().min(1)),
  confidenceNotes: z.string().min(1),
});

export type PitchReportOutput = z.infer<typeof pitchReportSchema>;

export type AnalyzePitchDeckInput = {
  extractedText: string;
  fileName: string;
};

export type AnalyzePitchDeckResult = {
  modelName: string;
  output: PitchReportOutput;
  raw: unknown;
};

export interface PitchAnalysisProvider {
  providerId: string;
  analyze(input: AnalyzePitchDeckInput): Promise<AnalyzePitchDeckResult>;
}
