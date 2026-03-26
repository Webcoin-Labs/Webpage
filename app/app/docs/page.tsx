import Link from "next/link";
import { BookOpen, Compass, ExternalLink, Sparkles } from "lucide-react";
import { docPages, type DocSection } from "@/lib/docs";
import { DocsChrome } from "@/components/docs/DocsChrome";

export const metadata = {
  title: "Docs - Webcoin Labs",
};

const overviewSections: DocSection[] = [
  {
    id: "docs-overview",
    title: "Documentation Overview",
    paragraphs: [
      "This documentation is split into focused topic pages to match professional docs systems. Use the left navigation to browse by category and the right panel to move within each page.",
      "Docs content maps directly to real product behavior in Webcoin Labs: OS architecture, profile privacy, ecosystem feed, connection requests, and account/auth behavior.",
    ],
    bullets: [
      "Multi-page structure with category navigation",
      "Role-aware product documentation",
      "Implementation-oriented references",
    ],
  },
  {
    id: "quick-links",
    title: "Quick Links",
    paragraphs: ["Start with Getting Started, then move to architecture and your role-specific OS docs."],
  },
];

const categories = ["Getting Started", "Core Concepts", "Operating Systems", "Platform"] as const;

export default function DocsPage() {
  return (
    <div className="py-8">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
              <BookOpen className="h-3.5 w-3.5" />
              Webcoin Labs Docs Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Professional multi-page docs for product workflows, workspace architecture, privacy, network flows, and platform operations.
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            <Link href="/app/workspaces" className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2.5 py-1.5 hover:text-foreground">
              <Compass className="h-3.5 w-3.5 text-cyan-300" /> Apps / Launcher
            </Link>
            <Link href="/app/ecosystem-feed" className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2.5 py-1.5 hover:text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Ecosystem Feed
            </Link>
            <a
              href="https://calendly.com/webcoinlabs/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2.5 py-1.5 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-300" /> Book Demo
            </a>
          </div>
        </div>
      </section>

      <DocsChrome toc={overviewSections}>
        <article id="docs-overview" className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-xl font-semibold tracking-tight">Documentation Overview</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Browse documentation by category. Each page is focused, long-form, and linked to real product routes and behavior.
          </p>
          <div className="mt-4 space-y-2">
            {categories.map((category) => (
              <div key={category} className="rounded-md border border-border/60 bg-background/60 p-3">
                <p className="text-sm font-medium">{category}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {docPages
                    .filter((page) => page.category === category)
                    .map((page) => (
                      <Link key={page.slug} href={`/app/docs/${page.slug}`} className="rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
                        <p className="font-medium text-foreground">{page.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{page.description}</p>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article id="quick-links" className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-xl font-semibold tracking-tight">Recommended Reading Path</h2>
          <div className="mt-3 space-y-2">
            {["getting-started", "workspace-architecture", "founder-os", "ecosystem-feed", "connection-requests"].map((slug, index) => {
              const page = docPages.find((item) => item.slug === slug);
              if (!page) return null;
              return (
                <Link key={slug} href={`/app/docs/${slug}`} className="block rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm hover:border-cyan-500/30">
                  <span className="text-cyan-300">{index + 1}.</span> {page.title}
                </Link>
              );
            })}
          </div>
        </article>
      </DocsChrome>
    </div>
  );
}
