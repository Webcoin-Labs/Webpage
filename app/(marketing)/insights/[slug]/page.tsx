import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnimatedSection } from "@/components/common/AnimatedSection";

type InsightPost = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  body: string; // markdown-ish plain text (rendered safely as text)
};

const INSIGHTS: Record<string, InsightPost> = {
  "why-base": {
    slug: "why-base",
    tag: "Ecosystem",
    title: "Why Base is Our First Ecosystem Track",
    excerpt:
      "Base's developer momentum and Coinbase infrastructure make it the ideal first track for our builder programs.",
    date: "Feb 2026",
    readTime: "4 min read",
    body: `## Summary
Base is one of the most important developer distribution layers in the market right now: low friction onboarding, strong ecosystem tooling, and a clear path from product to users.

## What we care about
- Practical distribution (not hype)
- Stablecoin rails and fintech primitives
- Teams shipping infrastructure that others can build on

## What Webcoin Labs does here
We help builders and founders package their identity, publish projects, and access a curated ecosystem network for introductions and partnerships.
`,
  },
  "builder-program-cohort-1": {
    slug: "builder-program-cohort-1",
    tag: "Program",
    title: "Builder Program — Cohort 1 Overview",
    excerpt:
      "8 weeks. Real projects. Ecosystem support. A breakdown of how our first cohort works, who it's for, and how to apply.",
    date: "Mar 2026",
    readTime: "6 min read",
    body: `## Cohort rhythm
Weekly sessions + office hours + milestone reviews. The goal is consistent shipping and real feedback loops.

## What you get
- Builder identity and project positioning
- Distribution and partner access (where relevant)
- Introductions where we have a strong reason to connect

## Apply
Apply in the portal and include links to your work and what you're building.`,
  },
  "what-builder-first-means": {
    slug: "what-builder-first-means",
    tag: "Philosophy",
    title: "What “Builder-First” Actually Means",
    excerpt:
      "The term gets thrown around a lot. Here's what it means at Webcoin Labs in practice.",
    date: "Mar 2026",
    readTime: "3 min read",
    body: `## Builder-first is operational
It means: reduce friction, ship iteratively, and focus on networks that create real distribution.

## What we won’t do
We don’t promise listings, funding, or guaranteed outcomes. We support builders with infrastructure, access, and a repeatable program cadence.`,
  },
};

const REDIRECTS: Record<string, string> = {
  "webcoin-labs-2-0-announcement": "/webcoin-labs-2-0",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (REDIRECTS[slug]) {
    return { title: "Redirecting… — Webcoin Labs" };
  }
  const post = INSIGHTS[slug];
  if (!post) return { title: "Not found — Webcoin Labs" };
  return {
    title: `${post.title} — Insights | Webcoin Labs`,
    description: post.excerpt,
  };
}

export default async function InsightSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const redirectTo = REDIRECTS[slug];
  if (redirectTo) redirect(redirectTo);

  const post = INSIGHTS[slug];
  if (!post) notFound();

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <Link
          href="/insights"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Insights
        </Link>

        <AnimatedSection>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-muted-foreground">
              {post.tag}
            </span>
            <span className="text-xs text-muted-foreground">{post.date}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{post.readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            {post.excerpt}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            {/* Render safely as text (no HTML) */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                {post.body}
              </pre>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

