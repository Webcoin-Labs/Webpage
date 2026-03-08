import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ArrowRight,
    FileText,
    User,
    FolderKanban,
    CheckCircle2,
    Sparkles,
    Layers,
    Lock,
    Bell,
    ShieldCheck,
} from "lucide-react";

function getCompletionScore(fields: Array<unknown>) {
    const filled = fields.filter((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
    }).length;
    return Math.round((filled / fields.length) * 100);
}

export default async function AppDashboard() {
    const session = await getServerSession(authOptions);
    const user = session!.user;

    const [applications, projectCount, builderProfile, founderProfile, investorProfile, introRequests] = await Promise.all([
        prisma.application.count({ where: { userId: user.id } }),
        prisma.project.count({ where: { ownerUserId: user.id } }),
        prisma.builderProfile.findUnique({ where: { userId: user.id } }),
        prisma.founderProfile.findUnique({ where: { userId: user.id } }),
        prisma.investorProfile.findUnique({ where: { userId: user.id } }),
        prisma.introRequest.count({ where: { founderId: user.id } }),
    ]);

    const isBuilder = user.role === "BUILDER";
    const isFounder = user.role === "FOUNDER";
    const isInvestor = user.role === "INVESTOR";

    const builderCompletion = getCompletionScore([
        builderProfile?.title,
        builderProfile?.skills,
        builderProfile?.preferredChains,
        builderProfile?.openTo,
        builderProfile?.bio,
        builderProfile?.location,
        builderProfile?.github || builderProfile?.portfolioUrl,
    ]);

    const founderCompletion = getCompletionScore([
        founderProfile?.companyName,
        founderProfile?.companyDescription,
        founderProfile?.chainFocus,
        founderProfile?.projectStage,
        founderProfile?.currentNeeds,
        founderProfile?.pitchDeckUrl,
        founderProfile?.bio,
    ]);

    const investorCompletion = getCompletionScore([
        investorProfile?.firmName,
        investorProfile?.roleTitle,
        investorProfile?.focus,
        investorProfile?.website,
    ]);

    const profileComplete = isBuilder ? builderCompletion >= 70 : isFounder ? founderCompletion >= 70 : isInvestor ? investorCompletion >= 70 : false;

    return (
        <div className="space-y-10 py-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your Webcoin Labs workspace for founder-builder collaboration.
                    </p>
                </div>
                <span
                    className={`text-xs px-3 py-1 rounded-full font-medium border ${
                        user.role === "BUILDER"
                            ? "border-blue-500/40 text-blue-300"
                            : user.role === "FOUNDER"
                                ? "border-green-500/40 text-green-300"
                                : user.role === "INVESTOR"
                                    ? "border-cyan-500/40 text-cyan-300"
                                    : "border-amber-500/40 text-amber-300"
                    }`}
                >
                    {user.role}
                </span>
            </div>

            {(isBuilder || isFounder || isInvestor) && !profileComplete && (
                <div className="p-5 rounded-xl border border-border/50 bg-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="font-semibold">Complete your profile to unlock full access</p>
                        <p className="text-sm text-muted-foreground">Profiles drive matching, readiness checks, and intros.</p>
                    </div>
                    <Link
                        href="/app/profile"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-300 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                        Complete Profile <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-border/50 bg-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-medium">Profile Completion</span>
                    </div>
                    <p className="text-2xl font-semibold">
                        {isBuilder ? builderCompletion : isFounder ? founderCompletion : investorCompletion}%
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-border">
                        <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${isBuilder ? builderCompletion : isFounder ? founderCompletion : investorCompletion}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Finish required fields for matching and analysis.
                    </p>
                </div>

                <div className="p-5 rounded-xl border border-border/50 bg-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-green-300" />
                        </div>
                        <span className="text-sm font-medium">Projects</span>
                    </div>
                    <p className="text-2xl font-semibold">{projectCount}</p>
                    <p className="text-xs text-muted-foreground mt-2">Standard plan: 1 active company</p>
                    <Link href="/app/projects" className="text-xs text-blue-300 mt-3 inline-flex items-center gap-1">
                        Manage projects <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="p-5 rounded-xl border border-border/50 bg-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-300" />
                        </div>
                        <span className="text-sm font-medium">AI Pitch Review</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Upload your deck for a free report.</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-full border border-border/60">Mocked</span>
                        <span>{founderProfile?.pitchDeckUrl ? "In review" : "Not submitted"}</span>
                    </div>
                    <Link href="/pitchdeck" className="text-xs text-blue-300 mt-3 inline-flex items-center gap-1">
                        Upload pitch deck <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </section>

            {isFounder && (
                <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Project completeness</p>
                                    <p className="text-xs text-muted-foreground">Standard plan: one active company</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Company profile</span>
                                    <span className="text-muted-foreground">{founderProfile?.companyName ? "Complete" : "Missing"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Project description</span>
                                    <span className="text-muted-foreground">{founderProfile?.companyDescription ? "Complete" : "Missing"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Chain focus</span>
                                    <span className="text-muted-foreground">{founderProfile?.chainFocus ? "Complete" : "Missing"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Pitch deck</span>
                                    <span className="text-muted-foreground">{founderProfile?.pitchDeckUrl ? "Uploaded" : "Missing"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-green-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Funding Readiness Checklist</p>
                                    <p className="text-xs text-muted-foreground">Keep your raise on track.</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Profile completed</span>
                                    <span className="text-green-300">{profileComplete ? "Complete" : "Pending"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Pitch deck uploaded</span>
                                    <span className="text-muted-foreground">{founderProfile?.pitchDeckUrl ? "Uploaded" : "Missing"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>AI report generated</span>
                                    <span className="text-muted-foreground">Queued (mock)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Funding narrative review</span>
                                    <span className="text-muted-foreground">Pending</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Builder Matches & Intro Requests</p>
                                    <p className="text-xs text-muted-foreground">Connect with builders and partners.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-border/50 p-4">
                                    <p className="text-xs text-muted-foreground">Builder matches</p>
                                    <p className="text-xl font-semibold mt-1">12</p>
                                    <p className="text-xs text-muted-foreground">Recommended (mock)</p>
                                </div>
                                <div className="rounded-lg border border-border/50 p-4">
                                    <p className="text-xs text-muted-foreground">Intro requests</p>
                                    <p className="text-xl font-semibold mt-1">{introRequests}</p>
                                    <p className="text-xs text-muted-foreground">In progress</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">AI Pitch Report</p>
                                    <p className="text-xs text-muted-foreground">Free analysis for founder readiness.</p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-black text-emerald-200 p-4 font-mono text-xs">
                                <div>&gt; deck_uploaded.pdf</div>
                                <div>&gt; analyzing market clarity...</div>
                                <div>&gt; checking founder readiness...</div>
                                <div>&gt; generating launch summary...</div>
                                <div className="text-emerald-300">&gt; report queued (mock)</div>
                            </div>
                            <div className="mt-4 text-xs text-muted-foreground space-y-1">
                                <div>Clarity score: Pending</div>
                                <div>Market positioning: Pending</div>
                                <div>Product thesis: Pending</div>
                                <div>Risks / missing areas: Pending</div>
                                <div>Funding readiness notes: Pending</div>
                                <div>GTM gaps: Pending</div>
                                <div>Suggested next steps: Pending</div>
                            </div>
                            <Link href="/pitchdeck" className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 py-2 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                                Upload Pitch Deck
                            </Link>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <p className="text-sm font-medium">Book a strategy call</p>
                            <p className="text-xs text-muted-foreground mt-2">Get funding readiness and GTM guidance.</p>
                            <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300">
                                Book a call <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-3">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Premium (coming soon)</p>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-2">
                                <li>Manage up to 10 companies</li>
                                <li>Team access and collaboration</li>
                                <li>Priority reviews and intros</li>
                                <li>Deep analytics dashboard</li>
                            </ul>
                            <button className="mt-4 w-full rounded-lg border border-border/60 text-xs text-muted-foreground py-2">Upgrade when available</button>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-3">
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Jobs marketplace (coming soon)</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Notify me when builder hiring opens.</p>
                            <button className="mt-4 w-full rounded-lg border border-border/60 text-xs text-muted-foreground py-2">Notify me</button>
                        </div>
                    </div>
                </section>
            )}

            {isBuilder && (
                <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <p className="text-sm font-medium mb-4">Recommended projects</p>
                            <div className="space-y-3">
                                {["Stablecoin treasury platform", "DeFi risk engine", "On-chain identity tools"].map((item) => (
                                    <div key={item} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                        <span className="text-sm">{item}</span>
                                        <span className="text-xs text-muted-foreground">Review</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <p className="text-sm font-medium mb-4">Founder connection requests</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Arbitrum payments team</span>
                                    <span className="text-xs text-muted-foreground">Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Stablecoin infrastructure</span>
                                    <span className="text-xs text-muted-foreground">New</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <p className="text-sm font-medium mb-4">Contribution opportunities</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Audit-ready smart contracts</span>
                                    <span className="text-xs text-muted-foreground">Open</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Launch campaign strategy</span>
                                    <span className="text-xs text-muted-foreground">Open</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-border/50 bg-card">
                            <div className="flex items-center gap-3 mb-3">
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Jobs marketplace (coming soon)</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Get notified when blockchain roles open.</p>
                            <button className="mt-4 w-full rounded-lg border border-border/60 text-xs text-muted-foreground py-2">Notify me</button>
                        </div>
                    </div>
                </section>
            )}

            {isInvestor && (
                <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="p-6 rounded-2xl border border-border/50 bg-card">
                        <p className="text-sm font-medium mb-3">Curated projects</p>
                        <div className="space-y-3 text-sm">
                            {[
                                "Blockchain treasury automation",
                                "Stablecoin settlement rails",
                                "Compliance-first launchpad",
                            ].map((item) => (
                                <div key={item} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                    <span>{item}</span>
                                    <span className="text-xs text-muted-foreground">Review</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl border border-border/50 bg-card">
                        <p className="text-sm font-medium mb-3">Investor tools (coming soon)</p>
                        <p className="text-xs text-muted-foreground">Deal flow reports, readiness scores, and investor memos.</p>
                        <button className="mt-4 w-full rounded-lg border border-border/60 text-xs text-muted-foreground py-2">Notify me</button>
                    </div>
                </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/app/profile" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-medium">Profile</span>
                    </div>
                    <p className="text-2xl font-semibold">{profileComplete ? "Complete" : "In progress"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Keep your information current.</p>
                </Link>

                <Link href="/app/projects" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-green-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-green-300" />
                        </div>
                        <span className="text-sm font-medium">Projects</span>
                    </div>
                    <p className="text-2xl font-semibold">{projectCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Manage your company profile.</p>
                </Link>

                <Link href="/app/apply" className="group p-5 rounded-xl border border-border/50 bg-card hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        </div>
                        <span className="text-sm font-medium">Applications</span>
                    </div>
                    <p className="text-2xl font-semibold">{applications}</p>
                    <p className="text-xs text-muted-foreground mt-1">Track program applications.</p>
                </Link>
            </section>
        </div>
    );
}
