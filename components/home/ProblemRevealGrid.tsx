"use client";

import { motion } from "framer-motion";
import { InteractiveRevealCard } from "./InteractiveRevealCard";

function FinanceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 18h16" />
      <path d="M6 14l3-3 3 2 5-6 1 1" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="12" cy="13" r="1" />
      <circle cx="17" cy="7" r="1" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M3.5 18c.6-2.6 2.5-4 4.5-4s4 1.4 4.5 4" />
      <path d="M13 18c.4-1.7 1.7-2.8 3.4-2.8 1.6 0 2.9 1 3.4 2.8" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4" width="17" height="14" rx="2" />
      <path d="M7 8h10M7 12h6" />
      <path d="M9 20h6" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 18V6" />
      <path d="M4 18h14" />
      <path d="M7 14l3-3 3 2 5-6" />
      <path d="M16 8h2v2" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="12" cy="17" r="2" />
      <path d="M7.7 8.3l2.9 7M16.3 8.3l-2.9 7M8 7h8" />
    </svg>
  );
}

function WorkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8M8 13h6M8 17h4" />
    </svg>
  );
}

function AbstractBackdrop({ variant }: { variant: "graph" | "nodes" | "blueprint" | "signal" | "gateway" | "stack" }) {
  if (variant === "graph") {
    return (
      <svg viewBox="0 0 300 160" className="w-full h-full">
        <path d="M10 120 C70 80, 120 130, 170 90 S260 60, 290 40" stroke="currentColor" strokeWidth="1.2" className="text-cyan-300/60" fill="none" />
        <path d="M12 132 C80 94, 126 144, 176 102 S258 72, 288 56" stroke="currentColor" strokeWidth="1" className="text-cyan-300/40" fill="none" />
      </svg>
    );
  }
  if (variant === "nodes") {
    return (
      <svg viewBox="0 0 300 160" className="w-full h-full">
        <circle cx="58" cy="48" r="3" className="fill-cyan-300/70" />
        <circle cx="130" cy="30" r="3" className="fill-cyan-300/70" />
        <circle cx="180" cy="74" r="3" className="fill-cyan-300/70" />
        <circle cx="252" cy="46" r="3" className="fill-cyan-300/70" />
        <path d="M58 48L130 30L180 74L252 46" className="stroke-cyan-300/45" strokeWidth="1.1" fill="none" />
      </svg>
    );
  }
  if (variant === "blueprint") {
    return (
      <svg viewBox="0 0 300 160" className="w-full h-full">
        <rect x="34" y="30" width="90" height="60" rx="3" className="stroke-emerald-300/45" strokeWidth="1" fill="none" />
        <rect x="150" y="50" width="110" height="70" rx="3" className="stroke-emerald-300/45" strokeWidth="1" fill="none" />
        <path d="M124 60h26M124 84h26" className="stroke-emerald-300/45" strokeWidth="1" />
      </svg>
    );
  }
  if (variant === "signal") {
    return (
      <svg viewBox="0 0 300 160" className="w-full h-full">
        <path d="M40 120c25-45 65-70 110-70s85 25 110 70" className="stroke-violet-300/45" strokeWidth="1.1" fill="none" />
        <path d="M60 120c20-30 50-48 90-48s70 18 90 48" className="stroke-violet-300/45" strokeWidth="1.1" fill="none" />
      </svg>
    );
  }
  if (variant === "gateway") {
    return (
      <svg viewBox="0 0 300 160" className="w-full h-full">
        <rect x="80" y="30" width="140" height="100" rx="20" className="stroke-blue-300/45" strokeWidth="1.1" fill="none" />
        <rect x="110" y="50" width="80" height="60" rx="10" className="stroke-blue-300/45" strokeWidth="1.1" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 160" className="w-full h-full">
      <rect x="46" y="34" width="200" height="24" rx="6" className="stroke-cyan-300/40" strokeWidth="1" fill="none" />
      <rect x="60" y="68" width="170" height="24" rx="6" className="stroke-cyan-300/40" strokeWidth="1" fill="none" />
      <rect x="74" y="102" width="140" height="24" rx="6" className="stroke-cyan-300/40" strokeWidth="1" fill="none" />
    </svg>
  );
}

const problems = [
  {
    shortTitle: "Capital inefficiency",
    sublabel: "Wrong investors, manual decks, cold outreach",
    detail:
      "Founders spend too long chasing the wrong investors, preparing decks manually, and navigating fundraising without a warm network.",
    icon: <FinanceIcon />,
    accent: "amber" as const,
    backdrop: <AbstractBackdrop variant="graph" />,
  },
  {
    shortTitle: "Finding the right builders",
    sublabel: "Trusted talent with blockchain experience",
    detail:
      "Great ideas stall when founders cannot quickly find trusted developers, operators, designers, and contributors with relevant blockchain experience.",
    icon: <TeamIcon />,
    accent: "cyan" as const,
    backdrop: <AbstractBackdrop variant="nodes" />,
  },
  {
    shortTitle: "From pitch to product",
    sublabel: "Execution support and builder relationships",
    detail:
      "Turning a concept into a launch-ready product requires execution support, technical guidance, and the right builder relationships.",
    icon: <ProductIcon />,
    accent: "emerald" as const,
    backdrop: <AbstractBackdrop variant="blueprint" />,
  },
  {
    shortTitle: "Launch without growth",
    sublabel: "Attention, community, creator support",
    detail:
      "Many projects can launch, but few know how to drive sustained attention, community growth, creator support, and meaningful user traction.",
    icon: <GrowthIcon />,
    accent: "violet" as const,
    backdrop: <AbstractBackdrop variant="signal" />,
  },
  {
    shortTitle: "Closed access networks",
    sublabel: "Launchpads, exchanges, ecosystem partners",
    detail:
      "Launchpads, exchanges, strategic partners, and ecosystem teams are often difficult to access without the right introductions and credibility.",
    icon: <NetworkIcon />,
    accent: "blue" as const,
    backdrop: <AbstractBackdrop variant="gateway" />,
  },
  {
    shortTitle: "Too much founder busywork",
    sublabel: "Decks, readiness, GTM, partner prep",
    detail:
      "Deck reviews, readiness analysis, GTM planning, and partner preparation often consume time that should be spent shipping product.",
    icon: <WorkIcon />,
    accent: "cyan" as const,
    backdrop: <AbstractBackdrop variant="stack" />,
  },
];

export function ProblemRevealGrid() {
  return (
    <section className="py-28 border-b border-border relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[8%] top-[10%] h-52 w-52 rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="absolute right-[10%] bottom-[8%] h-56 w-56 rounded-full bg-violet-500/10 blur-[100px]" />
      </div>
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mb-14"
        >
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Problems blockchain founders actually face
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mt-5 text-foreground leading-[1.05]">
            Problems blockchain founders actually face
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {problems.map((p, i) => (
            <motion.div
              key={p.shortTitle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.045, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <InteractiveRevealCard
                variant="problem"
                icon={p.icon}
                shortTitle={p.shortTitle}
                sublabel={p.sublabel}
                detail={p.detail}
                accentColor={p.accent}
                backgroundIllustration={p.backdrop}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
