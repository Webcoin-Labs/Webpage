"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };
    if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") {
        return { success: false, error: "Only founders can create projects" };
    }
    if (session.user.role === "FOUNDER") {
        const existingCount = await prisma.project.count({ where: { ownerUserId: session.user.id } });
        if (existingCount >= 1) {
            return { success: false, error: "Standard plan allows one active project. Upgrade for more." };
        }
    }

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
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`;
    }

    const project = await prisma.project.create({
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
