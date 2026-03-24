"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    message: z.string().min(10, "Message must be at least 10 characters"),
    source: z.string().optional(),
});

type ContactResult = { success: true } | { success: false; error: string };

export async function submitContact(formData: FormData): Promise<ContactResult> {
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const rl = await rateLimitAsync(rateLimitKey(email || "unknown", "contact"), 3, 60_000);
    if (!rl.ok) return { success: false, error: "Too many submissions. Please try again later." };

    const raw = {
        name: formData.get("name") as string,
        email,
        company: formData.get("company") as string,
        message: formData.get("message") as string,
        source: "contact-page",
    };

    const result = contactSchema.safeParse(raw);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    await db.lead.create({
        data: {
            name: result.data.name,
            email: result.data.email,
            company: result.data.company ?? null,
            message: result.data.message,
            source: result.data.source ?? null,
        },
    });
    return { success: true };
}
