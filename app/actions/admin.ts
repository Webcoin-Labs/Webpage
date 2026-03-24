"use server";

import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PartnerCategory, PartnerStatus } from "@prisma/client";
import { requireSessionUser, assertAnyRole } from "@/server/policies/authz";
import { writeAuditLog } from "@/lib/audit";

export async function updateApplicationStatus(id: string, status: string) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);

    const validStatuses = ["NEW", "REVIEWING", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");

    await db.application.update({
        where: { id },
        data: { status: status as "NEW" | "REVIEWING" | "ACCEPTED" | "REJECTED" },
    });
    await writeAuditLog({
        userId: user.id,
        action: "admin_update_application_status",
        entityType: "Application",
        entityId: id,
        metadata: { status },
    });

    revalidatePath("/app/admin");
}

export async function updateIntroRequestStatus(id: string, status: string) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);

    const valid = ["PENDING", "REVIEWING", "MATCHED", "CLOSED"];
    if (!valid.includes(status)) throw new Error("Invalid status");

    await db.introRequest.update({
        where: { id },
        data: { status },
    });
    await writeAuditLog({
        userId: user.id,
        action: "admin_update_intro_status",
        entityType: "IntroRequest",
        entityId: id,
        metadata: { status },
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
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);

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
        await db.partner.update({ where: { id }, data });
        await writeAuditLog({
            userId: user.id,
            action: "admin_update_partner",
            entityType: "Partner",
            entityId: id,
            metadata: { name: data.name, category: data.category, status: data.status },
        });
    } else {
        let uniqueSlug = slug;
        let n = 0;
        while (await db.partner.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${++n}`;
        }
        const created = await db.partner.create({ data: { ...data, slug: uniqueSlug } });
        await writeAuditLog({
            userId: user.id,
            action: "admin_create_partner",
            entityType: "Partner",
            entityId: created.id,
            metadata: { name: data.name, category: data.category, status: data.status },
        });
    }
    revalidatePath("/app/admin");
    revalidatePath("/app/admin/partners");
    revalidatePath("/network");
    revalidatePath("/");
}

export async function setBuilderVisibility(profileId: string, publicVisible: boolean) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    await db.builderProfile.update({ where: { id: profileId }, data: { publicVisible } });
    await writeAuditLog({
        userId: user.id,
        action: "admin_set_builder_visibility",
        entityType: "BuilderProfile",
        entityId: profileId,
        metadata: { publicVisible },
    });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/builders");
}

export async function setBuilderVerified(profileId: string, verifiedByWebcoinLabs: boolean) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    await db.builderProfile.update({ where: { id: profileId }, data: { verifiedByWebcoinLabs } });
    await writeAuditLog({
        userId: user.id,
        action: "admin_set_builder_verified",
        entityType: "BuilderProfile",
        entityId: profileId,
        metadata: { verifiedByWebcoinLabs },
    });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/builders");
}

export async function setProjectVisibility(projectId: string, publicVisible: boolean) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    await db.project.update({ where: { id: projectId }, data: { publicVisible } });
    await writeAuditLog({
        userId: user.id,
        action: "admin_set_project_visibility",
        entityType: "Project",
        entityId: projectId,
        metadata: { publicVisible },
    });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/projects");
}

export async function setProjectVerified(projectId: string, verifiedByWebcoinLabs: boolean) {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    await db.project.update({ where: { id: projectId }, data: { verifiedByWebcoinLabs } });
    await writeAuditLog({
        userId: user.id,
        action: "admin_set_project_verified",
        entityType: "Project",
        entityId: projectId,
        metadata: { verifiedByWebcoinLabs },
    });
    revalidatePath("/app/admin/moderation");
    revalidatePath("/projects");
}
