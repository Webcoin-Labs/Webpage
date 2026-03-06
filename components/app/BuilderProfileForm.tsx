"use client";

import { useState, useTransition } from "react";
import { upsertBuilderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
    initial: {
        handle?: string | null;
        headline?: string | null;
        bio?: string | null;
        skills?: string[];
        location?: string | null;
        github?: string | null;
        twitter?: string | null;
        website?: string | null;
        interests?: string[];
    } | null;
}

export function BuilderProfileForm({ initial }: Props) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await upsertBuilderProfile(formData);
            if (result.success) setSuccess(true);
            else setError(result.error);
        });
    };

    return (
        <div className="p-6 rounded-xl border border-border/50 bg-card">
            <h2 className="font-semibold mb-6">Builder Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Handle <span className="text-muted-foreground">(for /builders/your-handle)</span></label>
                        <input name="handle" defaultValue={initial?.handle ?? ""} placeholder="jane-builder" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Headline</label>
                        <input name="headline" defaultValue={initial?.headline ?? ""} placeholder="Full-stack Web3 developer" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Bio</label>
                    <textarea name="bio" rows={3} defaultValue={initial?.bio ?? ""} placeholder="Tell us about yourself..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Skills <span className="text-muted-foreground">(comma-separated)</span></label>
                        <input name="skills" type="text" defaultValue={initial?.skills?.join(", ") ?? ""} placeholder="Solidity, React, TypeScript..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Location</label>
                        <input name="location" type="text" defaultValue={initial?.location ?? ""} placeholder="City, Country" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">GitHub URL</label>
                        <input name="github" type="url" defaultValue={initial?.github ?? ""} placeholder="https://github.com/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Twitter / X</label>
                        <input name="twitter" type="text" defaultValue={initial?.twitter ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Website</label>
                        <input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Interests <span className="text-muted-foreground">(comma-separated)</span></label>
                        <input name="interests" type="text" defaultValue={initial?.interests?.join(", ") ?? ""} placeholder="DeFi, Gaming, Infra..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <CheckCircle2 className="w-4 h-4" /> Profile saved!
                    </div>
                )}

                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}
