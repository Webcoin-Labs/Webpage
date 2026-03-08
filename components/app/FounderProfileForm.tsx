"use client";

import { useState, useTransition } from "react";
import { upsertFounderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
    initial: {
        companyName?: string | null;
        companyDescription?: string | null;
        roleTitle?: string | null;
        bio?: string | null;
        location?: string | null;
        timezone?: string | null;
        projectStage?: "IDEA" | "MVP" | "LIVE" | null;
        chainFocus?: string | null;
        currentNeeds?: string[];
        website?: string | null;
        pitchDeckUrl?: string | null;
        linkedin?: string | null;
        telegram?: string | null;
        twitter?: string | null;
    } | null;
}

const stages = [
    { value: "IDEA", label: "Idea" },
    { value: "MVP", label: "MVP" },
    { value: "LIVE", label: "Live" },
];

export function FounderProfileForm({ initial }: Props) {
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
            const result = await upsertFounderProfile(formData);
            if (result.success) {
                setSuccess(true);
                if (shouldRedirect) {
                    router.push("/app");
                    router.refresh();
                }
            } else {
                setError(result.error);
            }
        });
    };

    return (
        <div className="p-6 rounded-xl border border-border/50 bg-card">
            <h2 className="font-semibold mb-2">Founder Profile</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Complete your profile to unlock funding readiness checks and ecosystem access.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
                        <input name="fullName" required defaultValue={defaultName} placeholder="Samira Khan" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Profile Photo URL</label>
                        <input name="profilePhoto" type="url" defaultValue={defaultImage} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Company / Project Name <span className="text-destructive">*</span></label>
                        <input name="companyName" type="text" required defaultValue={initial?.companyName ?? ""} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Your Role</label>
                        <input name="roleTitle" type="text" defaultValue={initial?.roleTitle ?? ""} placeholder="CEO, CTO, Founder" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Company Description <span className="text-destructive">*</span></label>
                    <textarea name="companyDescription" rows={3} required defaultValue={initial?.companyDescription ?? ""} placeholder="What are you building and why now?" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 resize-none" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Founder Bio</label>
                    <textarea name="bio" rows={3} defaultValue={initial?.bio ?? ""} placeholder="Your background, past wins, and focus." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Location</label>
                        <input name="location" type="text" defaultValue={initial?.location ?? ""} placeholder="City, Country" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Timezone</label>
                        <input name="timezone" type="text" defaultValue={initial?.timezone ?? ""} placeholder="UTC+1" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Project Stage <span className="text-destructive">*</span></label>
                        <select name="projectStage" required defaultValue={initial?.projectStage ?? "IDEA"} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40">
                            {stages.map((stage) => (
                                <option key={stage.value} value={stage.value}>{stage.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Chain / Ecosystem Focus <span className="text-destructive">*</span></label>
                        <input name="chainFocus" required defaultValue={initial?.chainFocus ?? ""} placeholder="Base, Ethereum, Solana" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Current Needs <span className="text-destructive">*</span></label>
                    <input name="currentNeeds" required defaultValue={initial?.currentNeeds?.join(", ") ?? ""} placeholder="Funding, builders, growth, launch" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated list.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Website</label>
                        <input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">LinkedIn</label>
                        <input name="linkedin" type="url" defaultValue={initial?.linkedin ?? ""} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Pitch Deck URL</label>
                        <input name="pitchDeckUrl" type="url" defaultValue={initial?.pitchDeckUrl ?? ""} placeholder="https://drive.google.com/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                        <p className="text-xs text-muted-foreground mt-1">Upload support coming soon.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Telegram</label>
                        <input name="telegram" type="text" defaultValue={initial?.telegram ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Twitter / X</label>
                    <input name="twitter" type="text" defaultValue={initial?.twitter ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40" />
                </div>

                <div className="text-xs text-muted-foreground border border-border/50 rounded-lg p-3">
                    Standard plan includes one active company profile. Premium unlocks multi-project management.
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 className="w-4 h-4" /> Profile saved!
                    </div>
                )}

                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-500/90 transition-colors disabled:opacity-60 flex items-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}
