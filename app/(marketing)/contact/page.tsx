import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact — Webcoin Labs",
    description: "Get in touch with Webcoin Labs for partnerships, founder support, or builder programs.",
};

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-24">
            <section className="py-20 container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-4">Contact</p>
                        <h1 className="text-5xl font-bold tracking-tight mb-4">
                            Let&apos;s <span className="gradient-text">talk</span>
                        </h1>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Whether you're an ecosystem looking to partner, a founder seeking support,
                            or a builder curious about programs — reach out.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                        {/* Info */}
                        <AnimatedSection delay={0.1} className="md:col-span-2 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <a href="mailto:hello@webcoinlabs.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        hello@webcoinlabs.com
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Telegram</h3>
                                    <a href="https://t.me/webcoinlabs" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        @webcoinlabs
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Based</h3>
                                    <p className="text-sm text-muted-foreground">Remote-first, global network</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    We respond to all serious inquiries within 3–5 business days. For urgent matters, Telegram is fastest.
                                </p>
                            </div>
                        </AnimatedSection>

                        {/* Form */}
                        <AnimatedSection delay={0.2} className="md:col-span-3">
                            <div className="p-6 rounded-2xl border border-border/50 bg-card">
                                <ContactForm />
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>
        </div>
    );
}
