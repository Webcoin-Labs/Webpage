"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";


const applicationSchema = z.object({
    type: z.enum(["BUILDER_PROGRAM", "FOUNDER_SUPPORT", "PARTNER", "DEMO_DAY_PITCH"]),
    why: z.string().min(20, "Please provide at least 20 characters"),
    experience: z.string().min(10),
    links: z.string().optional(),
    projectName: z.string().optional(),
    stage: z.string().optional(),
});

type ApplicationResult = { success: true; id: string } | { success: false; error: string };

export async function submitApplication(formData: FormData): Promise<ApplicationResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const rl = rateLimit(rateLimitKey(session.user.id, "application"), 5, 60_000);
    if (!rl.ok) return { success: false, error: "Too many submissions. Please try again in a minute." };

    const raw = {
        type: formData.get("type") as string,
        why: formData.get("why") as string,
        experience: formData.get("experience") as string,
        links: formData.get("links") as string,
        projectName: formData.get("projectName") as string,
        stage: formData.get("stage") as string,
    };

    const result = applicationSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    const app = await prisma.application.create({
        data: {
            userId: session.user.id,
            type: result.data.type as "BUILDER_PROGRAM" | "FOUNDER_SUPPORT" | "PARTNER" | "DEMO_DAY_PITCH",
            answers: {
                why: result.data.why,
                experience: result.data.experience,
                links: result.data.links,
                projectName: result.data.projectName,
                stage: result.data.stage,
            },
        },
    });

    return { success: true, id: app.id };
}
