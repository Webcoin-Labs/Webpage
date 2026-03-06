"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PartnerCategory, PartnerStatus } from "@prisma/client";

export async function updateApplicationStatus(id: string, status: string) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

    const validStatuses = ["NEW", "REVIEWING", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");

    await prisma.application.update({
        where: { id },
        data: { status: status as "NEW" | "REVIEWING" | "ACCEPTED" | "REJECTED" },
    });

    revalidatePath("/app/admin");
}

export async function updateIntroRequestStatus(id: string, status: string) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

    const valid = ["PENDING", "REVIEWING", "MATCHED", "CLOSED"];
    if (!valid.includes(status)) throw new Error("Invalid status");

    await prisma.introRequest.update({
        where: { id },
        data: { status },
    });
    revalidatePath("/app/admin");
}

const partnerSchema = z.object({
    name: z.string().min(1),
    category: z.enum(["VC", "CEX", "LAUNCHPAD", "GUILD", "MEDIA", "PORTFOLIO"]),
    status: z.enum(["LEGACY", "CURRENT"]),
    featured: z.boolean().optional(),
    url: z.string().url().optional().or(z.literal("")),
    logoPath: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
});

export async function createOrUpdatePartner(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

    const id = formData.get("id") as string | null;
    const raw = {
        name: formData.get("name"),
        category: formData.get("category"),
        status: formData.get("status"),
        featured: formData.get("featured") === "on" || formData.get("featured") === "true",
        url: (formData.get("url") as string) || "",
        logoPath: (formData.get("logoPath") as string) || null,
        sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
    };
    const parsed = partnerSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");

    const slug = (parsed.data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const data = {
        name: parsed.data.name as string,
        category: parsed.data.category as PartnerCategory,
        status: parsed.data.status as PartnerStatus,
        featured: parsed.data.featured ?? false,
        url: parsed.data.url || null,
        logoPath: parsed.data.logoPath || null,
        sortOrder: parsed.data.sortOrder ?? 0,
        slug: slug || undefined,
    };

    if (id) {
        await prisma.partner.update({ where: { id }, data });
    } else {
        let uniqueSlug = slug;
        let n = 0;
        while (await prisma.partner.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${++n}`;
        }
        await prisma.partner.create({ data: { ...data, slug: uniqueSlug } });
    }
    revalidatePath("/app/admin");
    revalidatePath("/app/admin/partners");
    revalidatePath("/network");
    revalidatePath("/");
}

export async function setBuilderVisibility(profileId: string, publicVisible: boolean) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
    await prisma.builderProfile.update({ where: { id: profileId }, data: { publicVisible } });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/builders");
}

export async function setBuilderVerified(profileId: string, verifiedByWebcoinLabs: boolean) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
    await prisma.builderProfile.update({ where: { id: profileId }, data: { verifiedByWebcoinLabs } });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/builders");
}

export async function setProjectVisibility(projectId: string, publicVisible: boolean) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
    await prisma.project.update({ where: { id: projectId }, data: { publicVisible } });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/projects");
}

export async function setProjectVerified(projectId: string, verifiedByWebcoinLabs: boolean) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
    await prisma.project.update({ where: { id: projectId }, data: { verifiedByWebcoinLabs } });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/projects");
}
