import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileDown } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PitchDeckHubClient } from "@/components/pitchdeck/PitchDeckHubClient";
import { PitchDeckUploadForm } from "@/components/pitchdeck/PitchDeckUploadForm";
import { RetryAnalysisButton } from "@/components/pitchdeck/RetryAnalysisButton";

export const metadata: Metadata = {
  title: "Pitch Deck AI Review - Webcoin Labs",
  description: "Upload a pitch deck and receive a free AI-generated readiness report.",
};

const SERVICES_PDF = "/pitchdeck/webcoin-services-2023.pdf";

export default async function PitchDeckHubPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [projects, recentDecks] = await Promise.all([
    userId
      ? prisma.project.findMany({
          where: { ownerUserId: userId },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    userId
      ? prisma.pitchDeck.findMany({
          where: {
            userId,
            OR: [
              { uploadAsset: { is: null } },
              {
                uploadAsset: {
                  is: { status: { in: ["ACTIVE", "FLAGGED", "REPROCESSING"] } },
                },
              },
            ],
          },
          include: {
            reports: { orderBy: { createdAt: "desc" }, take: 1 },
            uploadAsset: { select: { status: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const latestReport = recentDecks[0]?.reports[0] ?? null;
  const latestDeck = recentDecks[0] ?? null;
  const reportCompleted = latestReport?.status === "COMPLETED";

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
              Upload a PDF and receive a structured analysis report.
            </p>
            {userId ? (
              <PitchDeckUploadForm projects={projects} />
            ) : (
              <div className="mt-6 rounded-xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                Please{" "}
                <Link href="/login" className="text-blue-300">
                  sign in
                </Link>{" "}
                as a founder to upload and analyze a deck.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-black p-8 text-emerald-200">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI report preview</div>
            {latestDeck && latestReport ? (
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Upload status</span>
                  <span className="text-xs text-emerald-300">{latestDeck.uploadStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Processing status</span>
                  <span className="text-xs text-emerald-300">{latestDeck.processingStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deck type</span>
                  <span className="text-xs text-emerald-300">{latestReport.deckType ?? "unclear"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Report status</span>
                  <span className="text-xs text-emerald-300">{latestReport.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Asset moderation</span>
                  <span className="text-xs text-emerald-300">{latestDeck.uploadAsset?.status ?? "ACTIVE"}</span>
                </div>
                {latestReport.status === "FAILED" ? (
                  <div className="pt-2 border-t border-emerald-800/60 text-xs text-destructive space-y-2">
                    <p>{latestReport.errorMessage ?? "Analysis failed."}</p>
                    <RetryAnalysisButton pitchDeckId={latestDeck.id} />
                  </div>
                ) : null}
                {reportCompleted ? (
                  <div className="pt-2 border-t border-emerald-800/60 text-xs text-emerald-100/80 space-y-2">
                    <p>{latestReport.marketPositioningSummary ?? "Not clearly stated in the deck."}</p>
                    <p>{latestReport.productThesis ?? "Not clearly stated in the deck."}</p>
                    <p>{latestReport.fundingReadinessNotes ?? "Not clearly stated in the deck."}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-emerald-200/70 mt-6">
                No report yet. Upload a deck to generate your first AI report.
              </p>
            )}
          </div>
        </div>

        {reportCompleted && latestReport ? (
          <section className="mt-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-cyan-500/30 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Clarity</p>
                <p className="text-3xl font-semibold text-cyan-300 mt-2">{latestReport.clarityScore ?? "N/A"}</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Completeness</p>
                <p className="text-3xl font-semibold text-blue-300 mt-2">
                  {latestReport.completenessScore ?? "N/A"}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Investor Readiness</p>
                <p className="text-3xl font-semibold text-emerald-300 mt-2">
                  {latestReport.investorReadinessScore ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                ["Overview", latestReport.confidenceNotes],
                ["Problem", latestReport.problemSummary],
                ["Solution", latestReport.solutionSummary],
                ["Product Thesis", latestReport.productThesis],
                ["Market Positioning", latestReport.marketPositioningSummary],
                ["Business Model", latestReport.businessModelSummary],
                ["Target Customer", latestReport.targetCustomerSummary],
                ["Traction", latestReport.tractionSummary],
                ["Token / Web3 Analysis", latestReport.tokenModelSummary],
                ["Go-To-Market", latestReport.goToMarketSummary],
                ["Funding Readiness", latestReport.fundingReadinessNotes],
              ].map(([title, value]) => (
                <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {value || "Not clearly stated in the deck."}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/20 bg-card p-5">
                <p className="text-sm font-medium text-emerald-300">Strengths</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(latestReport.strengths) ? latestReport.strengths : []).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-card p-5">
                <p className="text-sm font-medium text-amber-300">Risks</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(latestReport.risks) ? latestReport.risks : []).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-card p-5">
                <p className="text-sm font-medium text-blue-300">GTM Gaps</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(latestReport.gtmGaps) ? latestReport.gtmGaps : []).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-card p-5">
                <p className="text-sm font-medium text-cyan-300">Next Steps</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(latestReport.nextSteps) ? latestReport.nextSteps : []).map((item, idx) => (
                    <li key={`${item}-${idx}`}>- {String(item)}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-card p-5">
              <p className="text-sm font-medium text-destructive">Missing Information</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(Array.isArray(latestReport.missingInformation) ? latestReport.missingInformation : []).map(
                  (item, idx) => (
                    <li key={`${item}-${idx}`}>- {String(item)}</li>
                  )
                )}
              </ul>
            </div>
          </section>
        ) : null}

        {recentDecks.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-border/50 bg-card p-6">
            <h3 className="text-lg font-semibold">Recent analysis history</h3>
            <div className="mt-4 space-y-3">
              {recentDecks.map((deck) => {
                const report = deck.reports[0];
                return (
                  <div
                    key={deck.id}
                    className="rounded-xl border border-border/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{deck.originalFileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(deck.createdAt).toLocaleString()} | Upload {deck.uploadStatus} | Process{" "}
                        {deck.processingStatus} | Asset {deck.uploadAsset?.status ?? "ACTIVE"}
                      </p>
                    </div>
                    <div className="text-xs">
                      <span className="px-2 py-1 rounded-full border border-emerald-500/40 text-emerald-300">
                        {report?.status ?? "QUEUED"}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        Clarity: {report?.clarityScore ?? "N/A"} | Readiness: {report?.investorReadinessScore ?? "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

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
                  <p className="text-xs text-muted-foreground">Production update stream</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Get notified on the latest published version and distribution updates.
              </p>
              <PitchDeckHubClient />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
