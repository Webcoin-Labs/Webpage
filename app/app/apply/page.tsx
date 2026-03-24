"use client";

import { useRef, useTransition, useState } from "react";
import { useSearchParams } from "next/navigation";
import { generateApplicationAssist, submitApplication } from "@/app/actions/application";
import { CheckCircle2, Loader2 } from "lucide-react";

const appTypes = [
    { value: "BUILDER_PROGRAM", label: "Builder Program", desc: "Apply to join a builder cohort" },
    { value: "FOUNDER_SUPPORT", label: "Founder Support", desc: "Apply for advisory and support" },
    { value: "PARTNER", label: "Partnership", desc: "Explore an ecosystem or sponsor partnership" },
    { value: "DEMO_DAY_PITCH", label: "Demo Day Pitch", desc: "Submit to present at an upcoming Demo Day" },
];

export default function ApplyPage() {
    const searchParams = useSearchParams();
    const typeParam = searchParams.get("type");
    const defaultType = typeParam === "demo_day" ? "DEMO_DAY_PITCH" : undefined;
    const [isPending, startTransition] = useTransition();
    const [isAssistPending, startAssistTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [aiScore, setAiScore] = useState<number | null>(null);
    const [aiSummary, setAiSummary] = useState("");
    const [aiStrengths, setAiStrengths] = useState<string[]>([]);
    const [aiGaps, setAiGaps] = useState<string[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);
        formData.set("coverLetter", coverLetter);
        if (aiScore !== null) formData.set("aiFitScore", String(aiScore));
        if (aiSummary) formData.set("aiSummary", aiSummary);
        startTransition(async () => {
            const result = await submitApplication(formData);
            if (result.success) setSuccess(true);
            else setError(result.error);
        });
    };

    const handleGenerateAssist = () => {
        if (!formRef.current) return;
        setError("");
        const formData = new FormData(formRef.current);
        startAssistTransition(async () => {
            const result = await generateApplicationAssist(formData);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setCoverLetter(result.coverLetter);
            setAiScore(result.fitScore);
            setAiSummary(result.summary);
            setAiStrengths(result.strengths);
            setAiGaps(result.gaps);
        });
    };

    if (success) {
        return (
            <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Application submitted!</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    We review all applications within 5 business days. We&apos;ll reach out via the email on your account.
                </p>
            </div>
        );
    }

    return (
        <div className="py-8 max-w-lg">
            <h1 className="text-2xl font-bold mb-2">Apply</h1>
            <p className="text-muted-foreground mb-8">Tell us what you&apos;re working on and what kind of support you need.</p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl border border-border/50 bg-card">
                <div>
                    <label className="block text-xs font-medium mb-3">Application Type</label>
                    <div className="space-y-2">
{appTypes.map((type, i) => (
                                <label key={type.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-cyan-500/30 cursor-pointer transition-colors has-[:checked]:border-cyan-500/50 has-[:checked]:bg-cyan-500/5">
                                <input type="radio" name="type" value={type.value} defaultChecked={defaultType ? type.value === defaultType : i === 0} className="mt-0.5 accent-cyan-500" />
                                <div>
                                    <p className="text-sm font-medium">{type.label}</p>
                                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Why Webcoin Labs? <span className="text-destructive">*</span></label>
                    <textarea name="why" required rows={4} placeholder="What are you building and why does this program/support matter to you?" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Your background / experience <span className="text-destructive">*</span></label>
                    <textarea name="experience" required rows={3} placeholder="Skills, previous projects, relevant experience..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1.5">Links <span className="text-muted-foreground">(GitHub, Twitter, project, etc.)</span></label>
                    <input name="links" placeholder="https://github.com/..., https://..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-cyan-200">AI Application Assist</p>
                        <button
                            type="button"
                            onClick={handleGenerateAssist}
                            disabled={isAssistPending}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 disabled:opacity-60"
                        >
                            {isAssistPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            {isAssistPending ? "Analyzing..." : "Generate cover letter + fit score"}
                        </button>
                    </div>
                    {aiScore !== null ? (
                        <div className="mt-3 space-y-2 text-xs">
                            <p className="text-muted-foreground">AI fit score: <span className="text-cyan-300 font-semibold">{aiScore}/100</span></p>
                            <p className="text-muted-foreground">{aiSummary}</p>
                            {aiStrengths.length > 0 ? <p className="text-emerald-300">Strengths: {aiStrengths.join(" | ")}</p> : null}
                            {aiGaps.length > 0 ? <p className="text-amber-300">Gaps: {aiGaps.join(" | ")}</p> : null}
                        </div>
                    ) : null}
                    <div className="mt-3">
                        <label className="block text-xs font-medium mb-1.5">Cover Letter</label>
                        <textarea
                            name="coverLetter"
                            rows={5}
                            value={coverLetter}
                            onChange={(event) => setCoverLetter(event.target.value)}
                            placeholder="Use AI assist or write your own cover letter."
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
