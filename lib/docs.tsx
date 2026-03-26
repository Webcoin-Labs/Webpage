export type DocsPageGroup = "Getting Started" | "Operating Systems" | "Core Primitives" | "Reference";

export type DocsBlock =
  | { type: "paragraphs"; paragraphs: string[] }
  | { type: "callout"; tone: "info" | "tip" | "warn"; title: string; body: string }
  | { type: "cardGrid"; columns?: 2 | 3 | 4; items: Array<{ title: string; description: string; eyebrow?: string }> }
  | { type: "steps"; items: Array<{ title: string; description: string }> }
  | { type: "bulletList"; items: string[] }
  | { type: "routeMap"; routes: Array<{ path: string; description: string }> }
  | { type: "integrationGrid"; items: Array<{ name: string; powers: string; state: string }> }
  | { type: "comparison"; items: Array<{ label: string; value: string }> }
  | { type: "schemaList"; items: Array<{ name: string; description: string; fields: string[] }> }
  | {
      type: "diagram";
      title?: string;
      caption?: string;
      diagram:
        | {
            kind: "hub";
            center: { title: string; description: string };
            nodes: Array<{ title: string; description: string }>;
          }
        | {
            kind: "flow";
            nodes: Array<{ title: string; description: string }>;
          };
    };

export type DocsSection = {
  id: string;
  title: string;
  blocks: DocsBlock[];
};

export type DocsPage = {
  slug: string[];
  group: DocsPageGroup;
  title: string;
  subtitle: string;
  navLabel: string;
  description: string;
  sections: DocsSection[];
  nextSteps: string[][];
};

export const docsNav = [
  {
    label: "Getting Started",
    items: [
      { slug: [], label: "Overview" },
      { slug: ["getting-started", "quickstart"], label: "Quickstart" },
      { slug: ["getting-started", "core-concepts"], label: "Core concepts" },
    ],
  },
  {
    label: "Operating Systems",
    items: [
      { slug: ["founder-os"], label: "Founder OS" },
      { slug: ["builder-os"], label: "Builder OS" },
      { slug: ["investor-os"], label: "Investor OS" },
      { slug: ["admin-os"], label: "Admin OS" },
    ],
  },
  {
    label: "Core Primitives",
    items: [
      { slug: ["core-primitives", "profiles-and-privacy"], label: "Profiles & privacy" },
      { slug: ["core-primitives", "ecosystem-feed"], label: "Ecosystem feed" },
      { slug: ["core-primitives", "connection-system"], label: "Connection system" },
      { slug: ["core-primitives", "integrations"], label: "Integrations" },
    ],
  },
  {
    label: "Reference",
    items: [
      { slug: ["reference", "data-model"], label: "Data Model" },
      { slug: ["reference", "api-reference"], label: "API Reference" },
      { slug: ["reference", "changelog"], label: "Changelog" },
    ],
  },
] as const;

const pages: DocsPage[] = [
  {
    slug: [],
    group: "Getting Started",
    title: "What is Webcoin Labs?",
    navLabel: "Overview",
    description: "Overview of the shared graph and the role-based operating systems.",
    subtitle: "A shared graph for founders, builders, investors, and operators, projected into focused operating systems instead of one noisy dashboard.",
    sections: [
      {
        id: "what-is-webcoin-labs",
        title: "What is Webcoin Labs",
        blocks: [
          { type: "paragraphs", paragraphs: ["Webcoin Labs is a shared operating layer, not just a directory. Identity, ventures, projects, trust signals, integrations, and activity all live in one graph.", "That graph is then shaped into Founder OS, Builder OS, Investor OS, and Admin OS so each role gets the right workflow without re-entering the same context repeatedly."] },
          { type: "cardGrid", columns: 4, items: [{ eyebrow: "Founder", title: "Founder OS", description: "Build, fundraise, and operate with ventures, decks, tokenomics, raise round, meetings, and market intelligence." }, { eyebrow: "Builder", title: "Builder OS", description: "Turn proof of work into visibility with GitHub sync, projects, opportunities, and career assets." }, { eyebrow: "Investor", title: "Investor OS", description: "Track deal flow, thesis, diligence, memos, meetings, and watchlist context." }, { eyebrow: "Operator", title: "Admin OS", description: "Manage moderation, uploads, notifications, review queues, and ecosystem health." }] },
          { type: "callout", tone: "info", title: "Simple mental model", body: "Create one profile, connect the tools you already use, then open the operating system that matches how you work." },
        ],
      },
      {
        id: "how-its-structured",
        title: "How it is structured",
        blocks: [
          { type: "diagram", title: "Shared graph architecture", caption: "The graph is shared. The operating systems are specialized views.", diagram: { kind: "hub", center: { title: "Shared Graph", description: "Users, profiles, ventures, projects, integrations, feed posts, profile views, and relationships." }, nodes: [{ title: "Founder OS", description: "Command center, ventures, pitch deck, tokenomics, raise round, meetings, market intelligence." }, { title: "Builder OS", description: "Proof profile, projects, GitHub activity, opportunities, resume lab, cover letters." }, { title: "Investor OS", description: "Deal flow, venture discovery, diligence, memos, watchlist, meetings." }, { title: "Admin OS", description: "Moderation, uploads, notifications, assignments, and ecosystem controls." }] } },
          { type: "comparison", items: [{ label: "Shared graph", value: "The actual relationship model behind identity, work, and signals." }, { label: "Operating system", value: "A role-native execution surface over that graph." }, { label: "Directory", value: "A browse surface. Useful, but not the product core." }] },
        ],
      },
      {
        id: "get-started",
        title: "Get started",
        blocks: [{ type: "steps", items: [{ title: "Pick your role", description: "Choose founder, builder, investor, or admin based on the work you are doing now." }, { title: "Complete your profile", description: "Identity, privacy settings, and trust signals determine what the graph can do for you." }, { title: "Connect integrations", description: "GitHub, Calendar, wallet, Gmail, Telegram, Notion, and X unlock richer automation." }] }],
      },
    ],
    nextSteps: [["getting-started", "quickstart"], ["getting-started", "core-concepts"], ["founder-os"]],
  },
  {
    slug: ["getting-started", "quickstart"],
    group: "Getting Started",
    title: "Quickstart",
    navLabel: "Quickstart",
    description: "Fast onboarding path from account creation to an active OS.",
    subtitle: "The shortest path to value: choose a role, complete your profile, connect your tools, and open the right workspace.",
    sections: [
      {
        id: "onboarding-flow",
        title: "Step-by-step onboarding",
        blocks: [{ type: "steps", items: [{ title: "Choose the operating system that matches your role", description: "Founder OS, Builder OS, Investor OS, or the internal admin surface." }, { title: "Complete your role and profile context", description: "A better profile improves discovery, trust, matching, and workflow relevance." }, { title: "Connect at least one integration", description: "The product becomes much more useful once it has real data to sync." }, { title: "Open the OS instead of lingering on overview pages", description: "The execution routes are where the product actually starts working." }] }],
      },
      {
        id: "integration-unlocks",
        title: "What integrations unlock",
        blocks: [{ type: "integrationGrid", items: [{ name: "GitHub", powers: "Builder proof, project credibility, and founder execution context.", state: "Best first connection for builders." }, { name: "Gmail", powers: "Email thread context and communication continuity.", state: "Useful when outreach matters." }, { name: "Calendar", powers: "Meetings, scheduling context, and execution follow-through.", state: "High value for founders and investors." }, { name: "Notion", powers: "Knowledge sync and memo support.", state: "Best for teams already using docs heavily." }, { name: "Wallet", powers: "Identity trust and ecosystem presence.", state: "Strong trust signal." }, { name: "Telegram", powers: "Founder communications and operator workflows.", state: "Useful for ecosystem-heavy teams." }, { name: "X", powers: "Public signal and outward-facing credibility.", state: "Helpful but optional." }] }],
      },
    ],
    nextSteps: [["getting-started", "core-concepts"], ["core-primitives", "integrations"], ["builder-os"]],
  },
  {
    slug: ["getting-started", "core-concepts"],
    group: "Getting Started",
    title: "Core concepts",
    navLabel: "Core concepts",
    description: "Shared graph, OS versus directory, trust, and feed philosophy.",
    subtitle: "These concepts explain why Webcoin Labs is organized around systems and signals instead of standalone pages.",
    sections: [
      {
        id: "shared-graph-model",
        title: "Shared graph model",
        blocks: [
          { type: "paragraphs", paragraphs: ["Users, profiles, ventures, projects, integrations, meetings, views, and feed activity live in one relationship model.", "That lets a builder project improve discovery, a profile view become a trust signal, and a founder update inform investor context without duplicate data entry."] },
          { type: "diagram", diagram: { kind: "flow", nodes: [{ title: "Identity", description: "User, role, public settings, contact methods, badges." }, { title: "Work", description: "Ventures, builder projects, pitch decks, diligence artifacts, applications." }, { title: "Signals", description: "Feed posts, profile views, integrations, meetings, and trust events." }] } },
        ],
      },
      {
        id: "os-vs-directory",
        title: "OS versus directory",
        blocks: [{ type: "comparison", items: [{ label: "Directory", value: "Browse and inspect public context." }, { label: "Operating system", value: "Take action, manage blockers, and execute work." }, { label: "Why both exist", value: "Discovery without execution is shallow. Execution without discovery is siloed." }] }],
      },
      {
        id: "trust-signals-and-feed",
        title: "Trust signals and feed philosophy",
        blocks: [{ type: "bulletList", items: ["Trust comes from evidence: profile quality, project history, venture context, wallets, integrations, and viewed behavior.", "The feed is a typed signal layer for discovery, not a vanity loop.", "Primary actions are operational: open profile, connect, or view the startup or project."] }, { type: "callout", tone: "warn", title: "No likes or comments by design", body: "Webcoin Labs optimizes for introductions and execution context, not public engagement theater." }],
      },
    ],
    nextSteps: [["core-primitives", "ecosystem-feed"], ["core-primitives", "profiles-and-privacy"], ["reference", "data-model"]],
  },
  {
    slug: ["founder-os"],
    group: "Operating Systems",
    title: "Founder OS",
    navLabel: "Founder OS",
    description: "Founder execution environment for ventures, fundraising, meetings, and market intelligence.",
    subtitle: "Founder OS turns the shared graph into a venture operating layer with focused routes instead of one overloaded dashboard.",
    sections: [
      {
        id: "what-founder-os-does",
        title: "What Founder OS does",
        blocks: [{ type: "cardGrid", columns: 3, items: [{ title: "Command Center", description: "Priorities, blockers, and weekly execution context." }, { title: "Ventures", description: "The active venture workspace and venture detail routes." }, { title: "Pitch Deck AI", description: "Deck analysis and readiness support from real files." }, { title: "Tokenomics Studio", description: "Scenario-based token modeling with revisions and imports." }, { title: "Raise Round", description: "Fundraising workflow, asks, commitments, and progress." }, { title: "Meetings", description: "Calendar-aware meeting execution." }, { title: "Market Intelligence", description: "Signal monitoring and founder insights." }, { title: "Communications", description: "Telegram and operator workflows." }, { title: "Integrations", description: "Connector setup and sync health." }] }],
      },
      {
        id: "route-map",
        title: "Founder route map",
        blocks: [{ type: "routeMap", routes: [{ path: "/app/founder-os", description: "Founder OS launcher and summary." }, { path: "/app/founder-os/[app]", description: "Modules such as command-center, ventures, pitch-deck, tokenomics, raise-round, meetings, market-intelligence, communications, and integrations." }, { path: "/app/founder-os/ventures/[ventureId]", description: "Dedicated venture detail route." }, { path: "/app/founder-os/investor-applications", description: "Founder-facing investor application surface." }, { path: "/app/founder-os/join/[token]", description: "Collaboration join flow." }] }],
      },
    ],
    nextSteps: [["core-primitives", "integrations"], ["reference", "data-model"], ["builder-os"]],
  },
  {
    slug: ["builder-os"],
    group: "Operating Systems",
    title: "Builder OS",
    navLabel: "Builder OS",
    description: "Proof-of-work-first workspace for builders.",
    subtitle: "Builder OS is built around evidence: shipped work, GitHub signals, portfolio context, and opportunity readiness.",
    sections: [
      {
        id: "proof-of-work",
        title: "Proof-of-work philosophy",
        blocks: [{ type: "paragraphs", paragraphs: ["Builder OS treats proof as the product. GitHub activity, projects, resumes, cover letters, and opportunities are different expressions of the same credibility layer."] }, { type: "callout", tone: "info", title: "Core principle", body: "It is easier to trust a builder when their output, identity, and context reinforce each other." }],
      },
      {
        id: "builder-modules",
        title: "Key builder surfaces",
        blocks: [{ type: "cardGrid", columns: 3, items: [{ title: "Proof Profile", description: "Profile completeness and proof score." }, { title: "Projects", description: "Portfolio entries tied to real work artifacts." }, { title: "GitHub Activity", description: "Repository-backed proof." }, { title: "Opportunity Inbox", description: "Matched applications and response flow." }, { title: "Resume Lab", description: "Resume assets tied back to profile context." }, { title: "Cover Letter Studio", description: "Context-aware outreach drafts." }] }, { type: "routeMap", routes: [{ path: "/app/builder-os", description: "Builder OS launcher and proof summary." }, { path: "/app/builder-os/[app]", description: "Modules including projects, github, opportunities, integrations, proof-profile, resume-lab, and cover-letters." }, { path: "/app/builder-os/projects/[projectId]", description: "Dedicated builder project page." }] }],
      },
    ],
    nextSteps: [["core-primitives", "integrations"], ["core-primitives", "profiles-and-privacy"], ["investor-os"]],
  },
  {
    slug: ["investor-os"],
    group: "Operating Systems",
    title: "Investor OS",
    navLabel: "Investor OS",
    description: "Deal flow and diligence workspace for investors.",
    subtitle: "Investor OS organizes thesis, opportunity review, diligence, meetings, and memos into one investor-native flow.",
    sections: [
      {
        id: "deal-flow-discovery",
        title: "Deal flow and discovery",
        blocks: [{ type: "cardGrid", columns: 3, items: [{ title: "Deal Flow Inbox", description: "Incoming venture opportunities with review states." }, { title: "Venture Discovery", description: "Public ventures and startup context." }, { title: "Diligence Workspace", description: "Evidence-led evaluation." }, { title: "Memos", description: "Structured venture notes." }, { title: "Watchlist", description: "Longer-horizon monitoring." }, { title: "Meetings", description: "Conversation scheduling and context." }] }],
      },
      {
        id: "investor-workflow",
        title: "Investor workflow",
        blocks: [{ type: "steps", items: [{ title: "Set thesis first", description: "Stage, chain, sector, and check size make discovery more useful." }, { title: "Review deal flow against venture context", description: "Move beyond titles and inspect the connected graph." }, { title: "Write diligence while context is fresh", description: "Memos are part of the workflow, not a separate afterthought." }] }, { type: "routeMap", routes: [{ path: "/app/investor-os", description: "Investor OS launcher and pipeline summary." }, { path: "/app/investor-os/[app]", description: "Modules including deal-flow, ventures, diligence, memos, meetings, watchlist, thesis-settings, and integrations." }, { path: "/app/investor-os/ventures/[ventureId]", description: "Dedicated venture view for evaluation." }] }],
      },
    ],
    nextSteps: [["core-primitives", "ecosystem-feed"], ["core-primitives", "integrations"], ["admin-os"]],
  },
  {
    slug: ["admin-os"],
    group: "Operating Systems",
    title: "Admin OS",
    navLabel: "Admin OS",
    description: "Moderation and ecosystem operations surface.",
    subtitle: "Admin OS is the private operator layer for moderation, uploads, notifications, assignments, and ecosystem control.",
    sections: [
      {
        id: "admin-purpose",
        title: "What Admin OS covers",
        blocks: [{ type: "cardGrid", columns: 3, items: [{ title: "Ecosystem moderation", description: "Review profile quality and trust." }, { title: "Upload review", description: "Moderate uploaded assets and inspect storage health." }, { title: "Visibility control", description: "Control what gets surfaced more prominently." }, { title: "Assignments", description: "Create and resolve internal admin work." }, { title: "Notifications", description: "Broadcast and notification operations." }, { title: "Analytics", description: "Track users, jobs, applications, uploads, and review queues." }] }],
      },
      {
        id: "admin-routes",
        title: "Admin route map",
        blocks: [{ type: "routeMap", routes: [{ path: "/app/admin", description: "Admin overview, quick links, stats, assignments, and score review." }, { path: "/app/admin/moderation", description: "Moderation workflows." }, { path: "/app/admin/uploads", description: "Upload review." }, { path: "/app/admin/storage", description: "Storage health." }, { path: "/app/admin/notifications", description: "Notification and broadcast workflows." }, { path: "/app/admin/leads, /intros, /events, /jobs, /pitch-decks, /partners, /rewards", description: "Additional operator sub-surfaces." }] }, { type: "callout", tone: "warn", title: "Private surface", body: "Admin routes are internal tooling, not public-facing user workspaces." }],
      },
    ],
    nextSteps: [["core-primitives", "profiles-and-privacy"], ["reference", "data-model"], ["reference", "changelog"]],
  },
  {
    slug: ["core-primitives", "profiles-and-privacy"],
    group: "Core Primitives",
    title: "Profiles and privacy",
    navLabel: "Profiles & privacy",
    description: "Public versus private profiles and contact controls.",
    subtitle: "Profiles are the trust surface for every role. Privacy controls decide how much of that surface is visible and to whom.",
    sections: [
      {
        id: "public-vs-private",
        title: "Public versus private profile",
        blocks: [{ type: "comparison", items: [{ label: "Public profile", value: "Participates in discovery and can appear in ecosystem-facing surfaces." }, { label: "Private profile", value: "Keeps full exposure off while preserving internal workflows." }, { label: "Open to connections", value: "A separate switch that governs connection behavior." }] }, { type: "callout", tone: "info", title: "Visibility is not contactability", body: "A profile can be discoverable while still limiting which contact methods are exposed." }],
      },
      {
        id: "contact-controls",
        title: "Contact method controls",
        blocks: [{ type: "bulletList", items: ["Telegram, email, Discord, X, and LinkedIn can all be enabled or disabled separately.", "Public exposure and enablement are independent settings.", "Audience-specific visibility makes investor-facing exposure more intentional."] }],
      },
      {
        id: "views-and-completeness",
        title: "Profile views and completeness",
        blocks: [{ type: "schemaList", items: [{ name: "PublicProfileSettings", description: "Stores visibility controls such as founderProfileLive, builderProfileLive, investorProfileLive, showEmail, openToConnections, and showInEcosystemFeed.", fields: ["founderProfileLive", "builderProfileLive", "investorProfileLive", "showEmail", "openToConnections", "showInEcosystemFeed"] }, { name: "ProfileView", description: "Tracks who viewed whom, with source and role context.", fields: ["viewerUserId", "viewedUserId", "source", "roleContext", "createdAt"] }, { name: "ProfileContactMethod", description: "Stores enabled contact methods and whether they are public.", fields: ["type", "label", "value", "isPublic", "isEnabled", "sortOrder"] }] }],
      },
    ],
    nextSteps: [["core-primitives", "connection-system"], ["reference", "data-model"], ["core-primitives", "ecosystem-feed"]],
  },
  {
    slug: ["core-primitives", "ecosystem-feed"],
    group: "Core Primitives",
    title: "Ecosystem feed",
    navLabel: "Ecosystem feed",
    description: "Typed feed scopes and low-noise discovery behavior.",
    subtitle: "The feed is a discovery primitive, not a social game. It is meant to surface useful change across the ecosystem.",
    sections: [
      {
        id: "feed-types",
        title: "Feed scopes",
        blocks: [{ type: "cardGrid", columns: 4, items: [{ title: "Founder", description: "Venture and founder-relevant signals." }, { title: "Builder", description: "Proof-of-work and opportunity signals." }, { title: "Investor", description: "Thesis and diligence-relevant signals." }, { title: "Global", description: "Cross-role discovery." }] }],
      },
      {
        id: "post-types",
        title: "Post types",
        blocks: [{ type: "bulletList", items: ["Startup launch", "Fundraising update", "Hiring builder", "Builder project", "Investor thesis or open call", "Milestone update"] }, { type: "callout", tone: "warn", title: "Primary actions over reactions", body: "Open profile, connect, or view startup. No likes or comments." }],
      },
    ],
    nextSteps: [["core-primitives", "connection-system"], ["investor-os"], ["reference", "data-model"]],
  },
  {
    slug: ["core-primitives", "connection-system"],
    group: "Core Primitives",
    title: "Connection system",
    navLabel: "Connection system",
    description: "How connect requests work and why contact exposure stays private by default.",
    subtitle: "Connections are explicit. Interest is visible, spam is reduced, and contact details stay under user control.",
    sections: [
      {
        id: "how-connect-works",
        title: "How connect works",
        blocks: [{ type: "steps", items: [{ title: "A user sends a connect request", description: "The request expresses intent without exposing private contact details." }, { title: "The recipient reviews the request", description: "Requests can be pending, accepted, declined, or canceled." }, { title: "Accepted requests create a relationship", description: "The system can then expose the right next layer of contact context." }] }],
      },
      {
        id: "privacy-behavior",
        title: "Privacy-respecting behavior",
        blocks: [{ type: "bulletList", items: ["Self-requests are blocked.", "Duplicate pending requests are blocked.", "Closed users cannot be forced into the connection flow.", "Contact exposure follows privacy settings, not sender demand."] }, { type: "callout", tone: "info", title: "Connection before contact", body: "The platform separates interest from exposure so users do not become public lead lists." }],
      },
    ],
    nextSteps: [["core-primitives", "profiles-and-privacy"], ["core-primitives", "integrations"], ["reference", "data-model"]],
  },
  {
    slug: ["core-primitives", "integrations"],
    group: "Core Primitives",
    title: "Integrations",
    navLabel: "Integrations",
    description: "What each integration powers and how connected versus disconnected states affect the UI.",
    subtitle: "Integrations are what make Webcoin Labs behave like an operating system instead of a static profile product.",
    sections: [
      {
        id: "integration-catalog",
        title: "Integration catalog",
        blocks: [{ type: "integrationGrid", items: [{ name: "GitHub", powers: "Builder proof, repository credibility, and founder execution context.", state: "Connected: evidence-backed work. Disconnected: manual proof." }, { name: "Gmail", powers: "Email threads and communication continuity.", state: "Connected: richer communication context." }, { name: "Calendar", powers: "Meetings and scheduling context.", state: "Connected: sync-aware execution." }, { name: "Notion", powers: "Knowledge sync and memo support.", state: "Connected: richer internal context." }, { name: "Wallet", powers: "Identity trust and ecosystem presence.", state: "Connected: stronger trust layer." }, { name: "Telegram", powers: "Communications workflows and operator queues.", state: "Connected: synced threads and replies." }, { name: "X", powers: "Public-facing signal context.", state: "Connected: better outward context." }] }],
      },
      {
        id: "ui-states",
        title: "Connected versus disconnected UI",
        blocks: [{ type: "comparison", items: [{ label: "Connected", value: "Modules show provider state, sync context, and richer activity." }, { label: "Disconnected", value: "Modules remain visible but degrade to setup prompts or manual fallback." }, { label: "Why it matters", value: "You can start early, but the value of connection remains obvious." }] }],
      },
    ],
    nextSteps: [["getting-started", "quickstart"], ["founder-os"], ["reference", "api-reference"]],
  },
  {
    slug: ["reference", "data-model"],
    group: "Reference",
    title: "Data Model",
    navLabel: "Data Model",
    description: "Non-technical guide to the core schema primitives.",
    subtitle: "The shared graph expressed as product primitives: identity, role context, work, and signals.",
    sections: [
      {
        id: "model-overview",
        title: "How the model is organized",
        blocks: [{ type: "diagram", title: "Shared graph layers", diagram: { kind: "flow", nodes: [{ title: "Identity layer", description: "User, badges, contact methods, public settings." }, { title: "Role layer", description: "FounderProfile, BuilderProfile, InvestorProfile." }, { title: "Work layer", description: "Venture, BuilderProject, PitchDeck, RaiseRound, DiligenceMemo." }, { title: "Signal layer", description: "FeedPost, ProfileView, ConnectionRequest, IntegrationConnection." }] } }],
      },
      {
        id: "core-primitives",
        title: "Core schema primitives",
        blocks: [{ type: "schemaList", items: [{ name: "User", description: "Canonical identity record.", fields: ["name", "email", "image", "username", "role", "bio"] }, { name: "FounderProfile / BuilderProfile / InvestorProfile", description: "Role-specific context layers.", fields: ["headline/title", "company or fund", "skills or thesis", "visibility"] }, { name: "Venture", description: "Startup record owned by a user.", fields: ["name", "tagline", "website", "chainEcosystem", "stage", "isPublic"] }, { name: "BuilderProject", description: "Builder portfolio entry.", fields: ["title", "description", "githubUrl", "liveUrl", "techStack"] }, { name: "FeedPost", description: "Typed ecosystem activity.", fields: ["authorUserId", "authorRole", "postType", "visibility", "title", "body"] }, { name: "ProfileView", description: "Who viewed which profile and when.", fields: ["viewerUserId", "viewedUserId", "source", "roleContext"] }, { name: "IntegrationConnection", description: "Provider connection state.", fields: ["provider", "status", "scopes", "lastSyncedAt"] }, { name: "InvestorApplication / DiligenceMemo", description: "Investor workflow primitives.", fields: ["ventureId", "investorUserId", "status", "summary", "riskFlagsJson"] }] }],
      },
    ],
    nextSteps: [["reference", "api-reference"], ["reference", "changelog"], ["getting-started", "core-concepts"]],
  },
  {
    slug: ["reference", "api-reference"],
    group: "Reference",
    title: "API Reference",
    navLabel: "API Reference",
    description: "Product-oriented route and server-action reference.",
    subtitle: "Webcoin Labs is mainly an App Router product. The most important contract is route surfaces plus server actions, not a single external REST API.",
    sections: [
      {
        id: "route-surfaces",
        title: "Route surfaces",
        blocks: [{ type: "routeMap", routes: [{ path: "/app/docs/*", description: "Documentation and product reference." }, { path: "/app/founder-os/*", description: "Founder operating system routes." }, { path: "/app/builder-os/*", description: "Builder operating system routes." }, { path: "/app/investor-os/*", description: "Investor operating system routes." }, { path: "/app/admin/*", description: "Private operator surfaces." }] }],
      },
      {
        id: "server-action-pattern",
        title: "Server action pattern",
        blocks: [{ type: "paragraphs", paragraphs: ["Many product mutations are driven by server actions rather than public endpoints. Examples include connection lifecycle, founder workflows, diligence memo creation, upload moderation, and admin assignments."] }, { type: "callout", tone: "info", title: "Developer rule of thumb", body: "Trace the route and its server action pair. That is the real product contract today." }],
      },
    ],
    nextSteps: [["reference", "data-model"], ["reference", "changelog"], ["core-primitives", "integrations"]],
  },
  {
    slug: ["reference", "changelog"],
    group: "Reference",
    title: "Changelog",
    navLabel: "Changelog",
    description: "Current documentation generation notes.",
    subtitle: "A compact record of what this documentation generation now covers.",
    sections: [
      { id: "current-docs-generation", title: "Current docs generation", blocks: [{ type: "bulletList", items: ["Docs rebuilt around a true multi-page information architecture.", "Operating systems documented as role-native route systems.", "Core primitives separated from OS pages for clarity.", "Reference pages added for shared graph and route-surface understanding."] }] },
      { id: "what-to-watch", title: "What to watch next", blocks: [{ type: "paragraphs", paragraphs: ["Likely future additions are deeper module references, explicit integration setup guides, and a more formal external API section if that contract stabilizes."] }] },
    ],
    nextSteps: [[], ["reference", "data-model"], ["getting-started", "quickstart"]],
  },
];

export const docsPages = pages;
export const docsPageMap = new Map(pages.map((page) => [page.slug.join("/"), page]));

export function getDocsHref(slug: readonly string[]) {
  return slug.length === 0 ? "/app/docs" : `/app/docs/${slug.join("/")}`;
}

export function getDocsPage(slug: readonly string[]) {
  return docsPageMap.get(slug.join("/")) ?? null;
}
