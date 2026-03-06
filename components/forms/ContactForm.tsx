"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/app/actions/contact";
import { CheckCircle2, Loader2 } from "lucide-react";

export function ContactForm() {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await submitContact(formData);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error);
            }
        });
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-lg">Message sent!</h3>
                <p className="text-sm text-muted-foreground">
                    We'll be in touch within 3–5 business days.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-medium mb-1.5">
                        Name <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition"
                        placeholder="Your name"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-xs font-medium mb-1.5">
                        Email <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition"
                        placeholder="you@example.com"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="company" className="block text-xs font-medium mb-1.5">
                    Company / Project
                </label>
                <input
                    id="company"
                    name="company"
                    type="text"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition"
                    placeholder="Optional"
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-xs font-medium mb-1.5">
                    Message <span className="text-destructive">*</span>
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition resize-none"
                    placeholder="Tell us about your project, what you're building, or how you'd like to partner..."
                />
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    "Send Message"
                )}
            </button>
        </form>
    );
}
