export type DocSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  codeTitle?: string;
  code?: string;
};

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  category: "Getting Started" | "Core Concepts" | "Operating Systems" | "Platform";
  sections: DocSection[];
};

export const docPages: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Initial setup flow for profile, workspaces, and first execution steps.",
    category: "Getting Started",
    sections: [
      {
        id: "account-setup",
        title: "Account Setup",
        paragraphs: [
          "Create your account and sign in. Post-auth redirect is enforced to /app for stable onboarding.",
          "Set your role and baseline profile identity (name, username, role context).",
        ],
        bullets: [
          "Complete profile essentials in /app/profile.",
          "Enable networking visibility if you want discovery.",
          "Configure public contact methods carefully.",
        ],
      },
      {
        id: "workspace-flow",
        title: "Workspace Flow",
        paragraphs: [
          "Use Apps / Launcher to enable and open OS workspaces.",
          "Dashboard is a summary surface. OS routes are dedicated execution surfaces.",
        ],
        codeTitle: "Core routes",
        code: "/app\n/app/workspaces\n/app/founder-os\n/app/builder-os\n/app/investor-os",
      },
      {
        id: "first-week",
        title: "First Week Checklist",
        paragraphs: [
          "Publish one ecosystem update, connect your first relevant profile, and keep profile data current.",
        ],
        bullets: [
          "Day 1: Complete profile + visibility.",
          "Day 2: Open role OS and review module launcher.",
          "Day 3: Publish first feed post.",
          "Day 4+: Use connection requests and review profile views.",
        ],
      },
    ],
  },
  {
    slug: "workspace-architecture",
    title: "Workspace Architecture",
    description: "How system surfaces and operating systems are separated.",
    category: "Core Concepts",
    sections: [
      {
        id: "system-vs-os",
        title: "System Surfaces vs OS Surfaces",
        paragraphs: [
          "System surfaces include dashboard, inbox, tasks/activity, people/network, and settings.",
          "Operating systems are isolated execution environments with role-specific tooling.",
        ],
      },
      {
        id: "module-routing",
        title: "Module Routing",
        paragraphs: [
          "Each OS has a launcher root route and module routes under /[app].",
          "This avoids giant stacked forms and keeps features compartmentalized.",
        ],
        codeTitle: "Route contract",
        code: "/app/founder-os\n/app/founder-os/[app]\n/app/builder-os\n/app/builder-os/[app]\n/app/investor-os\n/app/investor-os/[app]",
      },
    ],
  },
  {
    slug: "profiles-privacy",
    title: "Profiles and Privacy",
    description: "Visibility rules, route guards, and selective contact exposure.",
    category: "Core Concepts",
    sections: [
      {
        id: "visibility-model",
        title: "Visibility Model",
        paragraphs: [
          "Profiles support public/private visibility with strict route behavior.",
          "Public profiles participate in discovery/feed; private profiles are gated.",
        ],
        bullets: [
          "PUBLIC: discoverable and open profile route.",
          "PRIVATE: no public full-profile exposure.",
          "Open-to-connections is separate from visibility.",
        ],
      },
      {
        id: "contact-control",
        title: "Contact Control",
        paragraphs: [
          "Users decide which contact methods are publicly visible and enabled.",
        ],
        bullets: [
          "Telegram",
          "Email",
          "Discord",
          "X",
          "LinkedIn",
        ],
      },
    ],
  },
  {
    slug: "ecosystem-feed",
    title: "Ecosystem Feed",
    description: "Role-aware, typed activity layer shared across all operating systems.",
    category: "Core Concepts",
    sections: [
      {
        id: "feed-principles",
        title: "Feed Principles",
        paragraphs: [
          "The feed is not a generic social timeline. It is an execution/discovery signal layer.",
          "No vanity counters, no fake activity, no dead engagement placeholders.",
        ],
      },
      {
        id: "post-types",
        title: "Typed Feed Items",
        paragraphs: [
          "Feed uses typed posts and entity-linked activities so content remains structurally meaningful.",
        ],
        codeTitle: "Representative types",
        code: "STARTUP_LAUNCH\nFUNDRAISING_UPDATE\nHIRING_BUILDER\nBUILDER_PROJECT\nINVESTOR_THESIS\nINVESTOR_OPEN_CALL\nMILESTONE_UPDATE",
      },
    ],
  },
  {
    slug: "connection-requests",
    title: "Connection Requests",
    description: "Real request lifecycle with pending, accept, decline, and cancel states.",
    category: "Core Concepts",
    sections: [
      {
        id: "request-lifecycle",
        title: "Request Lifecycle",
        paragraphs: [
          "Connect actions resolve into a real request lifecycle and are visible in Messages and Notifications.",
        ],
        bullets: [
          "PENDING",
          "ACCEPTED",
          "DECLINED",
          "CANCELED",
        ],
      },
      {
        id: "behavior",
        title: "Behavior",
        paragraphs: [
          "Requests are blocked for self-target, duplicate pending state, and users not open to connections.",
          "Accepting creates mutual profile connection links.",
        ],
        codeTitle: "Server actions",
        code: "sendConnectionRequest(formData)\nrespondConnectionRequest(formData)\ncancelConnectionRequest(formData)",
      },
    ],
  },
  {
    slug: "founder-os",
    title: "Founder OS",
    description: "Founder-specific execution workspace and module philosophy.",
    category: "Operating Systems",
    sections: [
      {
        id: "founder-purpose",
        title: "Purpose",
        paragraphs: [
          "Founder OS is a dedicated operating system, separate from dashboard and system surfaces.",
          "It is organized via launcher and module routes for focused execution.",
        ],
      },
      {
        id: "founder-modules",
        title: "Typical Modules",
        paragraphs: [
          "Core modules include venture management, ecosystem feed, builder discovery, investor connect, launch readiness, and integrations.",
        ],
      },
    ],
  },
  {
    slug: "builder-os",
    title: "Builder OS",
    description: "Builder proof, opportunity readiness, and execution visibility.",
    category: "Operating Systems",
    sections: [
      {
        id: "builder-purpose",
        title: "Purpose",
        paragraphs: [
          "Builder OS surfaces project proof, stack credibility, and collaboration readiness.",
        ],
      },
      {
        id: "builder-workflow",
        title: "Workflow",
        paragraphs: [
          "Maintain builder profile quality, showcase projects, and monitor fit signals from opportunities.",
        ],
      },
    ],
  },
  {
    slug: "investor-os",
    title: "Investor OS",
    description: "Investor thesis, discovery pipeline, and venture signal review.",
    category: "Operating Systems",
    sections: [
      {
        id: "investor-purpose",
        title: "Purpose",
        paragraphs: [
          "Investor OS supports thesis-aligned discovery and pipeline tracking without social noise.",
        ],
      },
      {
        id: "investor-workflow",
        title: "Workflow",
        paragraphs: [
          "Set thesis/profile focus, review ecosystem signals, and open high-context founder conversations.",
        ],
      },
    ],
  },
  {
    slug: "account-auth",
    title: "Account and Auth",
    description: "Signup, login, redirect behavior, and email delivery basics.",
    category: "Platform",
    sections: [
      {
        id: "signup",
        title: "Signup and Welcome Email",
        paragraphs: [
          "Signup supports Resend-based welcome email dispatch when environment keys are configured.",
        ],
        codeTitle: "Environment",
        code: "RESEND_API_KEY\nSIGNUP_FROM_EMAIL\nPASSWORD_RESET_FROM_EMAIL",
      },
      {
        id: "redirect-safety",
        title: "Redirect Safety",
        paragraphs: [
          "Credential login/signup callbacks sanitize redirect targets and default to /app.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Common setup/runtime issues and quick resolution paths.",
    category: "Platform",
    sections: [
      {
        id: "prisma-sync",
        title: "Schema/Prisma Sync",
        paragraphs: [
          "If a new table does not exist, sync schema to DB and regenerate client before testing routes.",
        ],
        codeTitle: "Typical commands",
        code: "pnpm prisma db push\npnpm prisma generate --no-engine\npnpm typecheck",
      },
      {
        id: "auth-redirects",
        title: "Auth Redirect Issues",
        paragraphs: [
          "Validate callbackUrl sanitation and redirect callback behavior in auth config.",
        ],
      },
    ],
  },
];

export const docsBySlug = Object.fromEntries(docPages.map((page) => [page.slug, page]));

export const docsNavGroups = [
  {
    label: "Getting Started",
    slugs: ["getting-started"],
  },
  {
    label: "Core Concepts",
    slugs: ["workspace-architecture", "profiles-privacy", "ecosystem-feed", "connection-requests"],
  },
  {
    label: "Operating Systems",
    slugs: ["founder-os", "builder-os", "investor-os"],
  },
  {
    label: "Platform",
    slugs: ["account-auth", "troubleshooting"],
  },
] as const;

export function getDocPage(slug: string) {
  return docsBySlug[slug] ?? null;
}

export function getDocIndex(slug: string) {
  return docPages.findIndex((item) => item.slug === slug);
}

export function getDocPrevNext(slug: string) {
  const index = getDocIndex(slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? docPages[index - 1] : null,
    next: index < docPages.length - 1 ? docPages[index + 1] : null,
  };
}
