import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { getDocsPage } from "@/lib/docs";

export const metadata: Metadata = {
  title: "What is Webcoin Labs? - Docs - Webcoin Labs",
  description: "Overview of the shared graph and the role-based operating systems.",
};

export default function DocsOverviewPage() {
  const page = getDocsPage([]);

  if (!page) {
    throw new Error("Docs overview is missing.");
  }

  return <DocsLayout page={page} />;
}
