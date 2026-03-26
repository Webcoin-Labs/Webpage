import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { DocsChrome } from "@/components/docs/DocsChrome";
import { docPages, getDocPage, getDocPrevNext } from "@/lib/docs";

export async function generateStaticParams() {
  return docPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return { title: "Docs - Webcoin Labs" };
  return {
    title: `${page.title} - Docs - Webcoin Labs`,
    description: page.description,
  };
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  const { prev, next } = getDocPrevNext(slug);

  return (
    <div className="py-8">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-6">
        <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-300">{page.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{page.description}</p>
      </section>

      <DocsChrome currentSlug={page.slug} toc={page.sections}>
        <DocsArticle sections={page.sections} />

        <section className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/app/docs/${prev.slug}`} className="rounded-xl border border-border/60 bg-card p-4 hover:border-cyan-500/30">
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </p>
              <p className="mt-1 text-sm font-semibold">{prev.title}</p>
            </Link>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card/40 p-4" />
          )}
          {next ? (
            <Link href={`/app/docs/${next.slug}`} className="rounded-xl border border-border/60 bg-card p-4 hover:border-cyan-500/30">
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 text-sm font-semibold">{next.title}</p>
            </Link>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card/40 p-4" />
          )}
        </section>
      </DocsChrome>
    </div>
  );
}
