import {
  Briefcase,
  Building2,
  FolderKanban,
  GitBranch,
  Handshake,
  Inbox,
  LucideIcon,
  Network,
  PieChart,
  Rocket,
  Search,
  Sparkles,
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
  { slug: "ecosystem-feed", title: "Ecosystem Feed", description: "Execution updates from founders, builders, and investors.", icon: Network },
  { slug: "ventures", title: "Startup Layer", description: "Create and manage startup pages with team and venture context.", icon: FolderKanban },
  { slug: "pitch-deck", title: "Pitch Deck Analysis", description: "Upload, score, and improve startup decks.", icon: Sparkles },
  { slug: "tokenomics", title: "Tokenomics Studio", description: "Design allocation, vesting, and export investor-ready tokenomics.", icon: PieChart },
  { slug: "builder-discovery", title: "Builder Discovery", description: "Find builders by proof-of-work and fit signals.", icon: Search },
  { slug: "investor-connect", title: "Investor Discovery", description: "Track discovery, intros, and investor-ready startup context.", icon: Handshake },
  { slug: "integrations", title: "Integrations", description: "Manage connectors and automation health.", icon: Workflow },
];

export const builderModules: OsModule[] = [
  { slug: "ecosystem-feed", title: "Ecosystem Feed", description: "Execution updates and discovery across roles.", icon: Network },
  { slug: "proof-profile", title: "Proof Profile", description: "Builder identity, profile visibility, and trust signals.", icon: Briefcase },
  { slug: "projects", title: "Projects", description: "Portfolio linked to shipped work and outcomes.", icon: FolderKanban },
  { slug: "github", title: "GitHub Import", description: "Connect GitHub and import projects with minimal manual entry.", icon: GitBranch },
  { slug: "opportunities", title: "Opportunity Inbox", description: "Role-matched opportunities and intro requests.", icon: Inbox },
  { slug: "integrations", title: "Integrations", description: "Connector status, sync, and reconnect actions.", icon: Workflow },
];

export const investorModules: OsModule[] = [
  { slug: "ecosystem-feed", title: "Ecosystem Feed", description: "Execution updates from startups, builders, and investors.", icon: Network },
  { slug: "ventures", title: "Startup Discovery", description: "Discover startups, decks, tokenomics, and team signal.", icon: Building2 },
  { slug: "deal-flow", title: "Deal Flow", description: "Review intro requests and applications.", icon: Inbox },
  { slug: "diligence", title: "Diligence", description: "Structured evaluation notes and decision context.", icon: Rocket },
  { slug: "integrations", title: "Integrations", description: "Email/calendar sync and identity connectors.", icon: Workflow },
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

