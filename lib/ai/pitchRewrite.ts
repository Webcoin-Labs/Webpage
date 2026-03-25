import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/lib/env";

const sectionRewriteSchema = z.object({
  rewrittenTitle: z.string().min(1),
  rewrittenContent: z.string().min(1),
  conciseBullets: z.array(z.string().min(1)).min(2).max(8),
  founderInputNeeded: z.array(z.string().min(1)).default([]),
});

const generatedSectionSchema = z.object({
  sectionTitle: z.string().min(1),
  sectionContent: z.string().min(1),
  conciseBullets: z.array(z.string().min(1)).min(2).max(8),
  founderInputNeeded: z.array(z.string().min(1)).default([]),
});

const fullDeckSchema = z.object({
  summary: z.string().min(1),
  sections: z.array(generatedSectionSchema).min(4),
  founderInputNeeded: z.array(z.string().min(1)).default([]),
});

async function generateJson<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");
  const modelName = env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const response = await model.generateContent(prompt);
  const text = response.response.text();
  if (!text) throw new Error("AI returned empty output.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI returned malformed JSON.");
  }
  const validated = schema.safeParse(parsed);
  if (!validated.success) throw new Error("AI output schema mismatch.");
  return validated.data;
}

export async function rewritePitchDeckSection(params: {
  sectionTitle: string;
  sectionText: string;
  fullDeckText: string;
  tone: string;
  startupContext?: string;
}) {
  const prompt = `
You are rewriting one pitch deck section for founder clarity and investor readiness.
Use only provided content. Do not invent traction, team credentials, partnerships, revenue, market-size numbers, investor names, or tokenomics facts.
When data is missing, keep wording generic and list explicit founder inputs needed.

Style request: ${params.tone}
Section title: ${params.sectionTitle}
Section text:
${params.sectionText}

Deck context:
${params.fullDeckText.slice(0, 12000)}

Startup context (optional):
${params.startupContext ?? "Not provided"}

Return JSON:
{
  "rewrittenTitle": string,
  "rewrittenContent": string,
  "conciseBullets": string[],
  "founderInputNeeded": string[]
}
`.trim();

  return generateJson(prompt, sectionRewriteSchema);
}

export async function generateMissingSection(params: {
  sectionTitle: string;
  fullDeckText: string;
  startupContext?: string;
}) {
  const prompt = `
Generate a missing pitch deck section draft.
Strictly avoid invented claims. If numbers or proof are missing, include placeholders and mark what founder must provide.

Missing section: ${params.sectionTitle}
Deck context:
${params.fullDeckText.slice(0, 12000)}

Startup context:
${params.startupContext ?? "Not provided"}

Return JSON:
{
  "sectionTitle": string,
  "sectionContent": string,
  "conciseBullets": string[],
  "founderInputNeeded": string[]
}
`.trim();
  return generateJson(prompt, generatedSectionSchema);
}

export async function generateImprovedDeck(params: {
  deckText: string;
  startupContext?: string;
}) {
  const prompt = `
Create a full improved pitch deck draft from provided source content.
No fabricated metrics or claims. Keep outputs editable and mark missing inputs clearly.

Deck text:
${params.deckText.slice(0, 18000)}

Startup context:
${params.startupContext ?? "Not provided"}

Return JSON:
{
  "summary": string,
  "sections": [
    {
      "sectionTitle": string,
      "sectionContent": string,
      "conciseBullets": string[],
      "founderInputNeeded": string[]
    }
  ],
  "founderInputNeeded": string[]
}
`.trim();
  return generateJson(prompt, fullDeckSchema);
}

