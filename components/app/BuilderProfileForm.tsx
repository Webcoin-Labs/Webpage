"use client";

import { useState, useTransition } from "react";
import { upsertBuilderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
    initial: {
        handle?: string | null;
        title?: string | null;
        headline?: string | null;
        bio?: string | null;
        skills?: string[];
        preferredChains?: string[];
        openTo?: string[];
        location?: string | null;
        timezone?: string | null;
        experience?: string | null;
        github?: string | null;
        linkedin?: string | null;
        twitter?: string | null;
        website?: string | null;
        portfolioUrl?: string | null;
        interests?: string[];
    } | null;
}

const openToOptions = ["Freelance", "Full-time", "Co-founder", "Contributor"];

export function BuilderProfileForm({ initial }: Props) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const { data: session } = useSession();
    const defaultName = session?.user?.name ?? "";
    const defaultImage = session?.user?.image ?? "";
    const router = useRouter();
    const searchParams = useSearchParams();
    const shouldRedirect = searchParams.get("onboarding") === "1";

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await upsertBuilderProfile(formData);
            if (result.success) {
                setSuccess(true);
                if (shouldRedirect) {
                    router.push("/app");
                    router.refresh();
                }
            }
            else setError(result.error);
        });
    };

    return (
        <div className="p-6 rounded-xl border border-border/50 bg-card">
            <h2 className="font-semibold mb-2">Builder Profile</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Complete your profile to unlock matches and opportunities.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
                        <input name="fullName" required defaultValue={defaultName} placeholder="Alex Rivera" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Profile Photo URL</label>
                        <input name="profilePhoto" type="url" defaultValue={defaultImage} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Handle <span className="text-muted-foreground">(for /builders/your-handle)</span></label>
                        <input name="handle" defaultValue={initial?.handle ?? ""} placeholder="jane-builder" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Title <span className="text-destructive">*</span></label>
                        <input name="title" required defaultValue={initial?.title ?? ""} placeholder="Smart Contract Engineer" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Headline</label>
                    <input name="headline" defaultValue={initial?.headline ?? ""} placeholder="I build secure on-chain systems." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Bio</label>
                    <textarea name="bio" rows={3} defaultValue={initial?.bio ?? ""} placeholder="Tell us about your experience..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Skills <span className="text-destructive">*</span></label>
                        <input name="skills" type="text" required defaultValue={initial?.skills?.join(", ") ?? ""} placeholder="Rust, Solidity, TypeScript..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Preferred Chains <span className="text-destructive">*</span></label>
                        <input name="preferredChains" type="text" required defaultValue={initial?.preferredChains?.join(", ") ?? ""} placeholder="Base, Ethereum, Solana" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Open To <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-3">
                        {openToOptions.map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    name="openTo"
                                    value={option}
                                    defaultChecked={initial?.openTo?.includes(option) ?? false}
                                    className="h-4 w-4 rounded border-border bg-background text-blue-500 focus:ring-blue-500/40"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Experience</label>
                        <input name="experience" type="text" defaultValue={initial?.experience ?? ""} placeholder="5+ years in protocol engineering" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Location</label>
                        <input name="location" type="text" defaultValue={initial?.location ?? ""} placeholder="City, Country" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Timezone</label>
                    <input name="timezone" type="text" defaultValue={initial?.timezone ?? ""} placeholder="UTC+2" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">GitHub URL</label>
                        <input name="github" type="url" defaultValue={initial?.github ?? ""} placeholder="https://github.com/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">LinkedIn</label>
                        <input name="linkedin" type="url" defaultValue={initial?.linkedin ?? ""} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Twitter / X</label>
                        <input name="twitter" type="text" defaultValue={initial?.twitter ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Website</label>
                        <input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Portfolio URL</label>
                    <input name="portfolioUrl" type="url" defaultValue={initial?.portfolioUrl ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Interests <span className="text-muted-foreground">(comma-separated)</span></label>
                    <input name="interests" type="text" defaultValue={initial?.interests?.join(", ") ?? ""} placeholder="DeFi, infra, stablecoins" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                        <CheckCircle2 className="w-4 h-4" /> Profile saved!
                    </div>
                )}

                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-500/90 transition-colors disabled:opacity-60 flex items-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}
