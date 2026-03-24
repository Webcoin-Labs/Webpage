"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { env } from "@/lib/env";


const applicationSchema = z.object({
    type: z.enum(["BUILDER_PROGRAM", "FOUNDER_SUPPORT", "PARTNER", "DEMO_DAY_PITCH"]),
    why: z.string().min(20, "Please provide at least 20 characters"),
    experience: z.string().min(10),
    links: z.string().optional(),
    projectName: z.string().optional(),
    stage: z.string().optional(),
    coverLetter: z.string().max(4000).optional(),
    aiFitScore: z.coerce.number().int().min(0).max(100).optional(),
    aiSummary: z.string().max(2000).optional(),
});

type ApplicationResult = { success: true; id: string } | { success: false; error: string };
type AssistResult =
  | { success: true; coverLetter: string; fitScore: number; summary: string; strengths: string[]; gaps: string[] }
  | { success: false; error: string };

const applicationAssistSchema = z.object({
    type: z.enum(["BUILDER_PROGRAM", "FOUNDER_SUPPORT", "PARTNER", "DEMO_DAY_PITCH"]),
    why: z.string().min(20),
    experience: z.string().min(10),
    links: z.string().optional(),
    projectName: z.string().optional(),
    stage: z.string().optional(),
});

export async function generateApplicationAssist(formData: FormData): Promise<AssistResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const parsed = applicationAssistSchema.safeParse({
      type: String(formData.get("type") ?? ""),
      why: String(formData.get("why") ?? ""),
      experience: String(formData.get("experience") ?? ""),
      links: String(formData.get("links") ?? ""),
      projectName: String(formData.get("projectName") ?? ""),
      stage: String(formData.get("stage") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };

    if (!env.GEMINI_API_KEY) {
      return {
        success: false,
        error: "AI assist is not available right now. Configure Gemini integration in environment settings.",
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL ?? "gemini-1.5-pro",
        generationConfig: { temperature: 0.3 },
      });

      const prompt = `
You are an application reviewer for a web3 startup ecosystem.
Given this applicant input, return JSON only with:
{
  "fitScore": number(0-100),
  "summary": "1-2 sentence assessment",
  "strengths": ["...","..."],
  "gaps": ["...","..."],
  "coverLetter": "professional concise cover letter"
}

type: ${parsed.data.type}
why: ${parsed.data.why}
experience: ${parsed.data.experience}
links: ${parsed.data.links ?? "N/A"}
projectName: ${parsed.data.projectName ?? "N/A"}
stage: ${parsed.data.stage ?? "N/A"}
`.trim();

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      const raw = JSON.parse(text) as {
        fitScore?: number;
        summary?: string;
        strengths?: string[];
        gaps?: string[];
        coverLetter?: string;
      };

      const fitScore = Math.max(0, Math.min(100, Number(raw.fitScore ?? 0)));
      const summary = String(raw.summary ?? "No summary generated.").slice(0, 2000);
      const strengths = Array.isArray(raw.strengths) ? raw.strengths.slice(0, 6).map((item) => String(item)) : [];
      const gaps = Array.isArray(raw.gaps) ? raw.gaps.slice(0, 6).map((item) => String(item)) : [];
      const coverLetter = String(raw.coverLetter ?? "").slice(0, 4000);
      if (!coverLetter) {
        return { success: false, error: "AI assist did not return usable output. Please try again." };
      }

      return {
        success: true,
        fitScore,
        summary,
        strengths: strengths.length > 0 ? strengths : ["Relevant intent"],
        gaps: gaps.length > 0 ? gaps : ["Add concrete traction details"],
        coverLetter,
      };
    } catch {
      return { success: false, error: "AI assist failed to generate output. Please retry." };
    }
}

export async function submitApplication(formData: FormData): Promise<ApplicationResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const rl = await rateLimitAsync(rateLimitKey(session.user.id, "application"), 5, 60_000);
    if (!rl.ok) return { success: false, error: "Too many submissions. Please try again in a minute." };

    const raw = {
        type: formData.get("type") as string,
        why: formData.get("why") as string,
        experience: formData.get("experience") as string,
        links: formData.get("links") as string,
        projectName: formData.get("projectName") as string,
        stage: formData.get("stage") as string,
        coverLetter: formData.get("coverLetter") as string,
        aiFitScore: formData.get("aiFitScore") ? (formData.get("aiFitScore") as string) : undefined,
        aiSummary: formData.get("aiSummary") as string,
    };

    const result = applicationSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    const app = await db.application.create({
        data: {
            userId: session.user.id,
            type: result.data.type as "BUILDER_PROGRAM" | "FOUNDER_SUPPORT" | "PARTNER" | "DEMO_DAY_PITCH",
            answers: {
                why: result.data.why,
                experience: result.data.experience,
                links: result.data.links,
                projectName: result.data.projectName,
                stage: result.data.stage,
                coverLetter: result.data.coverLetter,
                aiFitScore: result.data.aiFitScore,
                aiSummary: result.data.aiSummary,
            },
        },
    });

    return { success: true, id: app.id };
}
