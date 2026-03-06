"use client";

import { useTransition, useState } from "react";
import { createProject } from "@/app/actions/project";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const stages = [
    { value: "IDEA", label: "💡 Idea" },
    { value: "MVP", label: "🚀 MVP" },
    { value: "LIVE", label: "✅ Live" },
];

export default function NewProjectPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await createProject(formData);
            if (result.success) router.push("/app/projects");
            else setError(result.error);
        });
    };

    return (
        <div className="py-8 max-w-lg">
            <h1 className="text-2xl font-bold mb-2">New Project</h1>
            <p className="text-muted-foreground mb-8">Create a project profile to share with the Webcoin Labs team.</p>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl border border-border/50 bg-card">
                <div>
                    <label className="block text-xs font-medium mb-1.5">Project Name <span className="text-destructive">*</span></label>
                    <input name="name" required className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Tagline</label>
                    <input name="tagline" maxLength={100} placeholder="One-line description..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5">Description</label>
                    <textarea name="description" rows={4} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Chain Focus</label>
                        <input name="chainFocus" placeholder="Base, Ethereum, Solana..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Stage</label>
                        <select name="stage" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
                            {stages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Website</label>
                        <input name="websiteUrl" type="url" placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5">GitHub</label>
                        <input name="githubUrl" type="url" placeholder="https://github.com/..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? "Creating..." : "Create Project"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
