import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  Compass,
  FolderKanban,
  GitBranch,
  Globe2,
  Handshake,
  Inbox,
  LineChart,
  LucideIcon,
  Megaphone,
  MessageSquare,
  Network,
  NotebookPen,
  PieChart,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

export type OsRole = "FOUNDER" | "BUILDER" | "INVESTOR";

export type OsModule = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const founderModules: OsModule[] = [
  { slug: "command-center", title: "Command Center", description: "Execution priorities and weekly brief.", icon: Rocket },
  { slug: "ventures", title: "Venture Workspace", description: "Manage ventures and active execution context.", icon: FolderKanban },
  { slug: "launch-readiness", title: "Launch Readiness", description: "Readiness scoring, blockers, and milestones.", icon: ShieldCheck },
  { slug: "builder-discovery", title: "Builder Discovery", description: "Find builders and collaboration-fit signals.", icon: Search },
  { slug: "investor-connect", title: "Investor Connect", description: "Pipeline, intros, and investor relationships.", icon: Handshake },
  { slug: "data-room", title: "Data Room", description: "Track assets, decks, and diligence materials.", icon: NotebookPen },
  { slug: "pitch-deck", title: "Pitch Deck AI", description: "Analyze deck quality and readiness from real files.", icon: Sparkles },
  { slug: "raise-round", title: "Raise Round", description: "Fundraising workflow and commitment tracking.", icon: Wallet },
  { slug: "tokenomics", title: "Tokenomics Studio", description: "Model token distribution and export spreadsheets.", icon: PieChart },
  { slug: "meetings", title: "Meetings", description: "Calendar-synced meeting execution and notes.", icon: CalendarClock },
  { slug: "market-intelligence", title: "Market Intelligence", description: "Signal monitoring and venture-relevant insights.", icon: LineChart },
  { slug: "communications", title: "Communications", description: "Telegram / channel workflows and operator queues.", icon: MessageSquare },
  { slug: "integrations", title: "Integrations", description: "Connect and monitor sync health across providers.", icon: Workflow },
];

export const builderModules: OsModule[] = [
  { slug: "proof-profile", title: "Proof Profile", description: "Identity, proof score, and builder signal profile.", icon: Briefcase },
  { slug: "projects", title: "Projects", description: "Work portfolio and contribution context.", icon: FolderKanban },
  { slug: "github", title: "GitHub Activity", description: "Repository and contribution sync workflow.", icon: GitBranch },
  { slug: "opportunities", title: "Opportunity Inbox", description: "Matched opportunities and response workflow.", icon: Inbox },
  { slug: "resume-lab", title: "Resume Lab", description: "Resume assets and profile artifacts.", icon: NotebookPen },
  { slug: "cover-letters", title: "Cover Letter Studio", description: "Context-specific outreach drafts.", icon: Megaphone },
  { slug: "work-log", title: "Work Log", description: "Execution timeline and delivery updates.", icon: Activity },
  { slug: "references", title: "References", description: "Proof links and credibility assets.", icon: Network },
  { slug: "integrations", title: "Integrations", description: "GitHub, wallet, and connector automation health.", icon: Workflow },
];

export const investorModules: OsModule[] = [
  { slug: "deal-flow", title: "Deal Flow Inbox", description: "Incoming ventures and status pipeline.", icon: Inbox },
  { slug: "ventures", title: "Venture Discovery", description: "Discover and filter active opportunities.", icon: Compass },
  { slug: "diligence", title: "Diligence Workspace", description: "Evidence-led venture evaluation workspace.", icon: ShieldCheck },
  { slug: "memos", title: "Memos", description: "Structured memo writing and updates.", icon: NotebookPen },
  { slug: "meetings", title: "Meetings", description: "Meeting schedule and execution context.", icon: CalendarClock },
  { slug: "watchlist", title: "Watchlist", description: "Track high-priority ventures over time.", icon: BarChart3 },
  { slug: "portfolio-support", title: "Portfolio Support", description: "Post-investment founder support workflows.", icon: Users },
  { slug: "thesis-settings", title: "Thesis Settings", description: "Configure thesis and fit constraints.", icon: Globe2 },
  { slug: "integrations", title: "Integrations", description: "Calendar, email, and source synchronization.", icon: Workflow },
];

export function modulesForRole(role: OsRole): OsModule[] {
  if (role === "FOUNDER") return founderModules;
  if (role === "BUILDER") return builderModules;
  return investorModules;
}

export function moduleBySlug(role: OsRole, slug: string): OsModule | null {
  return modulesForRole(role).find((module) => module.slug === slug) ?? null;
}

export const osRouteMeta = {
  FOUNDER: {
    root: "/app/founder-os",
    title: "Founder OS",
    icon: Rocket,
    subtitle: "Venture execution operating environment",
    modules: founderModules,
  },
  BUILDER: {
    root: "/app/builder-os",
    title: "Builder OS",
    icon: Briefcase,
    subtitle: "Proof-of-work execution environment",
    modules: builderModules,
  },
  INVESTOR: {
    root: "/app/investor-os",
    title: "Investor OS",
    icon: Building2,
    subtitle: "Deal-flow and diligence operating environment",
    modules: investorModules,
  },
} as const;

