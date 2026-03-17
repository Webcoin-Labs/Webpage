import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  type AnalyzePitchDeckInput,
  type AnalyzePitchDeckResult,
  type PitchAnalysisProvider,
  pitchReportSchema,
} from "@/lib/ai/providers/types";
import { env } from "@/lib/env";

function buildPrompt(input: AnalyzePitchDeckInput): string {
  return `
You are the AI Pitch Deck Analyst for Webcoin Labs.
Analyze startup pitch decks and return a STRICT, STRUCTURED, EVIDENCE-BOUND report.

PRIMARY RULE:
Only analyze what is actually present in the uploaded deck content.
Do not invent traction, revenue, user numbers, funding history, market size, tokenomics, partnerships, audits, investors, compliance status, technical architecture, or roadmap details.

REASONING RULES:
1) Use only the content provided in the deck text.
2) Light inference is allowed only when directly supported by text.
3) Label implied points clearly as implied/inferred.
4) If confidence is low, state it in confidenceNotes.
5) Never present inference as confirmed fact.
6) Be practical, concise, and honest.

SCORING RULES:
- Scores are 0-100.
- clarityScore: narrative clarity of problem/solution/product.
- completenessScore: coverage of investor-critical sections.
- investorReadinessScore: readiness for investor conversations from deck content only.
- Do not inflate scores.

WEB3 RULE:
- If clearly Web3, evaluate blockchain necessity, token necessity, chain specificity, wallet flow clarity, onchain/offchain clarity, protocol vs business model clarity, distribution realism, incentive clarity, trust assumptions, and dependency risks only when supported.
- If non-Web3, do not force crypto framing.
- If missing, mark as unclear or missing.

ANTI-HALLUCINATION FAILSAFE:
- Remove invented numbers.
- Remove invented traction.
- Remove invented tokenomics/partnerships/audits/revenue.
- Convert uncertain facts to uncertainty statements.
- Explicitly include missing investor-critical items.

OUTPUT FORMAT:
Return ONLY valid JSON with exactly this schema:
{
  "deckType": "web3" | "web2" | "unclear",
  "clarityScore": number 0-100,
  "completenessScore": number 0-100,
  "investorReadinessScore": number 0-100,
  "problemSummary": string,
  "solutionSummary": string,
  "productThesis": string,
  "targetCustomerSummary": string,
  "marketPositioningSummary": string,
  "businessModelSummary": string,
  "tractionSummary": string,
  "goToMarketSummary": string,
  "tokenModelSummary": string,
  "fundingReadinessNotes": string,
  "strengths": string[],
  "gtmGaps": string[],
  "risks": string[],
  "nextSteps": string[],
  "missingInformation": string[],
  "confidenceNotes": string
}

FIELD RULES:
- If unclear: use "Not clearly stated in the deck".
- For Web2 deck tokenModelSummary must be "Not applicable".
- tractionSummary must not infer traction.

Document name: ${input.fileName}
Document text:
${input.extractedText}
`.trim();
}

export class GeminiPitchAnalysisProvider implements PitchAnalysisProvider {
  providerId = "GEMINI";

  async analyze(input: AnalyzePitchDeckInput): Promise<AnalyzePitchDeckResult> {
    const apiKey = env.GEMINI_API_KEY;
    const modelName = env.GEMINI_MODEL ?? "gemini-1.5-pro";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const response = await model.generateContent(buildPrompt(input));
    const content = response.response.text();
    if (!content) throw new Error("Gemini returned an empty response.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Gemini returned malformed JSON.");
    }

    const validated = pitchReportSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error("Gemini response did not match expected report schema.");
    }

    return {
      modelName,
      output: validated.data,
      raw: parsed,
    };
  }
}
