import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { docsPages, getDocsPage } from "@/lib/docs";

export async function generateStaticParams() {
  return docsPages
    .filter((page) => page.slug.length > 0)
    .map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const page = getDocsPage(resolved.slug);

  if (!page) {
    return { title: "Docs - Webcoin Labs" };
  }

  return {
    title: `${page.title} - Docs - Webcoin Labs`,
    description: page.description,
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolved = await params;
  const page = getDocsPage(resolved.slug);

  if (!page) {
    notFound();
  }

  return <DocsLayout page={page} />;
}
