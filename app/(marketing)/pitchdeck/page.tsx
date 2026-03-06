import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileDown, FileQuestion } from "lucide-react";
import { PitchDeckHubClient } from "@/components/pitchdeck/PitchDeckHubClient";

export const metadata: Metadata = {
  title: "Pitch Decks — Webcoin Labs",
  description: "Webcoin Labs pitch decks: Services (2023) and Builders & Founders Network (2.0).",
};

// Services deck: copy "Webcoin Labs - Pitch Deck v1.pdf" to public/pitchdeck/webcoin-services-2023.pdf
const SERVICES_PDF = "/pitchdeck/webcoin-services-2023.pdf";

export default function PitchDeckHubPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Pitch Decks
          </h1>
          <p className="text-muted-foreground text-sm">
            Official decks for partners and founders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Services Deck (2023) */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <FileDown className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Webcoin Labs — Services Deck
                </h2>
                <p className="text-xs text-muted-foreground">Legacy, 2023</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Overview of services and positioning from our 2023 deck. For the latest builder-first model, see the 2.0 deck when available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={SERVICES_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
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

          {/* Card B: Builders & Founders 2.0 — Coming soon + Notify */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Builders & Founders Network Deck (2.0)
                </h2>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Our updated deck for the builder-first innovation hub. Not yet published. Get notified when it’s ready.
            </p>
            <PitchDeckHubClient />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Place PDFs in <code className="bg-muted px-1 rounded">public/pitchdeck/</code>. Services deck: <code className="bg-muted px-1 rounded">webcoin-services-2023.pdf</code> (or copy from Webcoin Labs - Pitch Deck v1.pdf).
        </p>
      </div>
    </div>
  );
}
