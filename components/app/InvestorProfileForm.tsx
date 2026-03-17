"use client";

import { useState, useTransition } from "react";
import { upsertInvestorProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
    initial: {
        firmName?: string | null;
        roleTitle?: string | null;
        focus?: string | null;
        location?: string | null;
        website?: string | null;
        linkedin?: string | null;
        twitter?: string | null;
    } | null;
}

export function InvestorProfileForm({ initial }: Props) {
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
            const result = await upsertInvestorProfile(formData);
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
            <h2 className="font-semibold mb-2">Investor Profile</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Share your focus areas so we can match you with relevant projects.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
                        <input name="fullName" required defaultValue={defaultName} placeholder="Alex Morgan" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Profile Image</label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-cyan-500/40">
                            <ImagePlus className="h-4 w-4 text-cyan-300" />
                            Upload PNG/JPG (max 5MB)
                            <input name="avatarFile" type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" />
                        </label>
                        <input name="profilePhoto" type="url" defaultValue={defaultImage} placeholder="Or use external image URL" className="mt-2 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Firm Name <span className="text-destructive">*</span></label>
                        <input name="firmName" required defaultValue={initial?.firmName ?? ""} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Role Title</label>
                        <input name="roleTitle" defaultValue={initial?.roleTitle ?? ""} placeholder="Partner, Analyst" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Investment Focus</label>
                    <input name="focus" defaultValue={initial?.focus ?? ""} placeholder="Infrastructure, stablecoins, DeFi" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Location</label>
                        <input name="location" defaultValue={initial?.location ?? ""} placeholder="City, Country" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Website</label>
                        <input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">LinkedIn</label>
                        <input name="linkedin" type="url" defaultValue={initial?.linkedin ?? ""} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Twitter / X</label>
                        <input name="twitter" defaultValue={initial?.twitter ?? ""} placeholder="@handle" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <CheckCircle2 className="w-4 h-4" /> Profile saved!
                    </div>
                )}

                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}
