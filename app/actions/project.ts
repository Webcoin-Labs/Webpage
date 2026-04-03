"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";

const projectSchema = z.object({
    name: z.string().min(2, "Project name required"),
    tagline: z.string().max(100).optional(),
    description: z.string().optional(),
    chainFocus: z.string().optional(),
    stage: z.enum(["IDEA", "MVP", "LIVE"]),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    githubUrl: z.string().url().optional().or(z.literal("")),
    twitterUrl: z.string().optional(),
});

type ProjectResult = { success: true; id: string } | { success: false; error: string };

export async function createProject(formData: FormData): Promise<ProjectResult> {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };
    if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") {
        return { success: false, error: "Only founders can create projects" };
    }

    const rl = await rateLimitAsync(rateLimitKey(session.user.id, "project-create"), 12, 60_000);
    if (!rl.ok) return { success: false, error: "Too many project creations. Please wait and try again." };

    const raw = {
        name: formData.get("name") as string,
        tagline: (formData.get("tagline") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
        chainFocus: (formData.get("chainFocus") as string) || undefined,
        stage: (formData.get("stage") as string) || "IDEA",
        websiteUrl: (formData.get("websiteUrl") as string) || "",
        githubUrl: (formData.get("githubUrl") as string) || "",
        twitterUrl: (formData.get("twitterUrl") as string) || undefined,
    };

    const result = projectSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    const slugBase = result.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let slug = slugBase;
    let n = 0;
    while (await db.project.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`;
    }

    const project = await db.project.create({
        data: {
            ownerUserId: session.user.id,
            ...result.data,
            slug,
            stage: result.data.stage as "IDEA" | "MVP" | "LIVE",
            websiteUrl: result.data.websiteUrl || null,
            githubUrl: result.data.githubUrl || null,
        },
    });

    revalidatePath("/app/projects");
    return { success: true, id: project.id };
}

