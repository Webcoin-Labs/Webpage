import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

function getModel() {
  if (!env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: env.GEMINI_MODEL ?? "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.3,
    },
  });
}

export async function generateInvestorPitchEmail(input: {
  founderName: string;
  startupName: string;
  startupTagline?: string | null;
  problem?: string | null;
  solution?: string | null;
  traction?: string | null;
  investorName?: string | null;
  investorThesis?: string | null;
}) {
  const model = getModel();
  if (!model) {
    const investorTarget = input.investorName ? ` ${input.investorName}` : "";
    return `Subject: Intro request: ${input.startupName}\n\nHi${investorTarget},\n\nI am ${input.founderName}, founder of ${input.startupName}. ${input.startupTagline ?? ""}\n\nWe are solving ${input.problem ?? "a clear startup problem"} with ${input.solution ?? "a focused product approach"}.\n\nTraction so far: ${input.traction ?? "early stage and validating with users"}.\n\nYour investment focus appears aligned with our direction. If useful, I can share a short deck and progress metrics.\n\nBest,\n${input.founderName}`;
  }

  const prompt = `
You are helping a founder write a concise, high-conviction cold VC email.
Return plain text only.
Requirements:
- 120-170 words
- clear and specific
- no hype, no fake numbers
- include a subject line and email body

Founder: ${input.founderName}
Startup: ${input.startupName}
Tagline: ${input.startupTagline ?? "N/A"}
Problem: ${input.problem ?? "N/A"}
Solution: ${input.solution ?? "N/A"}
Traction: ${input.traction ?? "N/A"}
Investor target: ${input.investorName ?? "N/A"}
Investor thesis: ${input.investorThesis ?? "N/A"}
`.trim();

  const response = await model.generateContent(prompt);
  return response.response.text().trim();
}

export async function generatePitchOneLiner(input: {
  startupName: string;
  problem?: string | null;
  solution?: string | null;
  targetUser?: string | null;
}) {
  const model = getModel();
  if (!model) {
    return `${input.startupName} helps ${input.targetUser ?? "target users"} solve ${input.problem ?? "a key problem"} with ${input.solution ?? "a better product experience"}.`;
  }

  const prompt = `
Write one crisp one-liner startup pitch (max 28 words).
No buzzwords, no exaggeration.

Startup: ${input.startupName}
Problem: ${input.problem ?? "N/A"}
Solution: ${input.solution ?? "N/A"}
Target user: ${input.targetUser ?? "N/A"}
`.trim();
  const response = await model.generateContent(prompt);
  return response.response.text().trim();
}

export async function summarizeMarketSignals(input: {
  rawSignals: string;
  startupContext?: string | null;
}) {
  const model = getModel();
  if (!model) {
    return {
      founderPainPoints: "Limited signal quality. Add clearer Reddit/Twitter inputs for stronger pain-point clustering.",
      trendingProblems: "No robust trend summary generated yet. Save additional market signals and rerun.",
    };
  }

  const prompt = `
You are a startup market intelligence assistant.
From the following Reddit/Twitter signals, produce:
1) founderPainPoints (3-5 concise bullets in one paragraph)
2) trendingProblems (3-5 concise bullets in one paragraph)

Focus on practical, daily founder execution pain.
No made-up claims.

Startup context: ${input.startupContext ?? "N/A"}
Signals:
${input.rawSignals}

Return JSON only:
{"founderPainPoints":"...","trendingProblems":"..."}
`.trim();

  const response = await model.generateContent(prompt);
  const text = response.response.text().trim();
  try {
    const parsed = JSON.parse(text) as { founderPainPoints: string; trendingProblems: string };
    return parsed;
  } catch {
    return {
      founderPainPoints: "Signal parsing fallback: gather clearer user complaints around infra, onboarding, and conversion.",
      trendingProblems: "Signal parsing fallback: focus on top recurring friction themes and validate with customer calls.",
    };
  }
}
