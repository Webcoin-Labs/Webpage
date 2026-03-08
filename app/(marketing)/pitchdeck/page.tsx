import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileDown } from "lucide-react";
import { PitchDeckHubClient } from "@/components/pitchdeck/PitchDeckHubClient";

export const metadata: Metadata = {
  title: "Pitch Deck AI Review - Webcoin Labs",
  description: "Upload a pitch deck and receive a free AI-generated readiness report.",
};

const reportSections = [
  "Clarity score",
  "Market positioning summary",
  "Product thesis summary",
  "Risks / missing areas",
  "Funding readiness notes",
  "GTM gaps",
  "Suggested next steps",
];

const SERVICES_PDF = "/pitchdeck/webcoin-services-2023.pdf";

export default function PitchDeckHubPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-300">AI pitch review</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4">
            Upload your pitch deck for a free AI report.
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Get a structured report covering clarity, positioning, risks, and funding readiness.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-lg font-semibold">Pitch Deck Upload</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a PDF or share a link. Processing is mocked for now.
            </p>
            <form className="mt-6 space-y-4">
              <input
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm"
                placeholder="Deck link (Google Drive, Notion, Dropbox)"
              />
              <div className="rounded-lg border border-dashed border-border/80 bg-background px-4 py-6 text-sm text-muted-foreground">
                Drag and drop PDF (coming soon)
              </div>
              <button type="button" className="w-full rounded-lg bg-blue-500 text-white py-3 text-sm font-medium hover:bg-blue-500/90">
                Upload & Run AI Review
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-border bg-black p-8 text-emerald-200">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI report preview</div>
            <div className="mt-6 space-y-3 text-sm">
              {reportSections.map((section) => (
                <div key={section} className="flex items-center justify-between">
                  <span>{section}</span>
                  <span className="text-xs text-emerald-300">Pending</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-200/70 mt-6">Mocked output. Final report will appear here.</p>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Official decks</p>
              <h2 className="text-2xl md:text-3xl font-semibold mt-3">Webcoin Labs Pitch Decks</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Legacy and upcoming decks for partners and founders.
              </p>
            </div>
            <Link href="/app" className="inline-flex items-center gap-2 text-sm text-blue-300">
              Go to dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Webcoin Labs - Services Deck</h3>
                  <p className="text-xs text-muted-foreground">Legacy, 2023</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Overview of services and positioning from our 2023 deck.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={SERVICES_PDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <FileDown className="w-4 h-4" /> View
                </a>
                <a
                  href={SERVICES_PDF}
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-accent text-sm font-medium"
                >
                  Download
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Founder-Builder Network Deck</h3>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Updated deck for the current platform. Get notified when it is ready.
              </p>
              <PitchDeckHubClient />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
