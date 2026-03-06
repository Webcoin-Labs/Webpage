"use client";

import { useState, useTransition } from "react";
import { upsertFounderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
    initial: {
        companyName?: string | null;
        roleTitle?: string | null;
        website?: string | null;
        pitchDeckUrl?: string | null;
        telegram?: string | null;
        twitter?: string | null;
    } | null;
}

export function FounderProfileForm({ initial }: Props) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await upsertFounderProfile(formData);
            if (result.success) setSuccess(true);
            else setError(result.error);
        });
    };

    return (
        <div className="p-6 rounded-xl border border-border/50 bg-card">
            <h2 className="font-semibold mb-6">Founder Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Company / Project Name <span className="text-destructive">*</span></label>
                        <input name="companyName" type="text" required defaultValue={initial?.companyName ?? ""} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Your Role</label>
                        <input name="roleTitle" type="text" defaultValue={initial?.roleTitle ?? ""} placeholder="CEO, CTO, Founder..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Website</label>
                    <input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Pitch Deck URL <span className="text-muted-foreground">(optional)</span></label>
                    <input name="pitchDeckUrl" type="url" defaultValue={initial?.pitchDeckUrl ?? ""} placeholder="https://drive.google.com/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Telegram</label>
                        <input name="telegram" type="text" defaultValue={initial?.telegram ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Twitter / X</label>
                        <input name="twitter" type="text" defaultValue={initial?.twitter ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-violet-400">
                        <CheckCircle2 className="w-4 h-4" /> Profile saved!
                    </div>
                )}

                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}
