"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1-3 3.7-4.7 7-4.7S18 16 19 19" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19l4-4M7 7l10 10" />
      <path d="M4 8l4-4 3 3-4 4zM13 16l4-4 3 3-4 4z" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 15l2-2 2 1 4-4" />
      <path d="M8 8h8" />
    </svg>
  );
}

function FundIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10.5h17" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="12" cy="17" r="2" />
      <path d="M8 7h8M7.7 8.3l3.1 7M16.3 8.3l-3.1 7" />
    </svg>
  );
}

function LaunchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l3.2 6.5L21 11l-4.5 4.2 1 5.8L12 18l-5.5 3 1-5.8L3 11l5.8-1.5L12 3z" />
    </svg>
  );
}

const workflowSteps = [
  {
    title: "Create Profile",
    subtitle: "Founder and builder identity",
    short:
      "Set profile, chain focus, skills, and context.",
    detail:
      "Founder and builder profiles help users showcase experience, intent, chain focus, skills, and project context inside the Webcoin Labs network.",
    icon: <ProfileIcon />,
    accent: "cyan",
  },
  {
    title: "Build Your Project",
    subtitle: "Execution and collaboration",
    short:
      "Move from idea to execution with the right collaborators.",
    detail:
      "Webcoin Labs helps founders move from idea to execution by connecting them with builders, collaborators, and product support.",
    icon: <BuildIcon />,
    accent: "emerald",
  },
  {
    title: "AI Pitch Analysis",
    subtitle: "Clarity and positioning",
    short:
      "Upload your deck and get AI-powered review feedback.",
    detail:
      "Upload a pitch deck and receive an AI-powered project report covering clarity, positioning, risks, GTM gaps, readiness, and next steps.",
    icon: <AnalyzeIcon />,
    accent: "blue",
  },
  {
    title: "Funding Readiness",
    subtitle: "Prepared for fundraising",
    short:
      "Improve narrative, readiness, and investor targeting.",
    detail:
      "Founders can prepare for fundraising through AI deck analysis, readiness checks, clearer positioning, and curated access to relevant investor networks.",
    icon: <FundIcon />,
    accent: "amber",
  },
  {
    title: "Network Connections",
    subtitle: "Warm intros to ecosystem",
    short:
      "Reach builders, partners, launchpads, and operators.",
    detail:
      "The platform helps founders reach builders, partners, launchpads, exchanges, and ecosystem operators through structured visibility and introductions.",
    icon: <ConnectIcon />,
    accent: "violet",
  },
  {
    title: "Distribution & Launch",
    subtitle: "Growth after shipping",
    short:
      "Run campaigns, activate KOLs, and coordinate launch.",
    detail:
      "Webcoin Labs supports growth through community campaigns, KOL access, launch planning, and ecosystem-aligned distribution strategy.",
    icon: <LaunchIcon />,
    accent: "emerald",
  },
];

const accentStyles: Record<string, string> = {
  cyan: "border-cyan-400/35 text-cyan-300",
  emerald: "border-emerald-400/35 text-emerald-300",
  amber: "border-amber-400/35 text-amber-300",
  violet: "border-violet-400/35 text-violet-300",
  blue: "border-blue-400/35 text-blue-300",
};

function WorkflowStepCard({
  title,
  subtitle,
  short,
  detail,
  icon,
  accent,
}: {
  title: string;
  subtitle: string;
  short: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const accentClass = accentStyles[accent] ?? accentStyles.cyan;

  return (
    <motion.article
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-slate-700/70 bg-gradient-to-b from-slate-900/85 to-slate-950/95 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_85%_10%,rgba(56,189,248,0.12),transparent_70%)]" />
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex items-start gap-4 relative z-10">
          <motion.div
            animate={
              expanded
                ? { boxShadow: "0 0 18px rgba(56,189,248,0.35)", scale: 1.04 }
                : { boxShadow: "0 0 0 rgba(0,0,0,0)", scale: 1 }
            }
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`w-12 h-12 rounded-xl border bg-slate-900/80 flex items-center justify-center ${accentClass}`}
          >
            {icon}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
            <h3 className="text-xl font-semibold text-foreground mt-1">{title}</h3>
            <p className="text-sm text-slate-300 mt-2">{short}</p>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden text-sm text-slate-300 mt-4 pt-4 border-t border-slate-700/70 leading-relaxed"
            >
              {detail}
            </motion.p>
          )}
        </AnimatePresence>
      </button>
    </motion.article>
  );
}

export function CapabilityRevealGrid() {
  return (
    <section className="py-28 border-b border-border relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>
      <div className="absolute left-[18%] top-[18%] h-64 w-64 rounded-full bg-blue-500/10 blur-[110px] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-3xl mb-14"
        >
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-300">
            How Webcoin Labs helps
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mt-5 text-foreground leading-[1.05]">
            How Webcoin Labs helps
          </h2>
          <p className="text-lg text-slate-300 mt-6">
            A founder-builder platform for building, funding readiness, distribution, and ecosystem access.
          </p>
        </motion.div>
        <div className="space-y-4">
          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <WorkflowStepCard {...step} />
              {i < workflowSteps.length - 1 && (
                <div className="h-9 flex items-center justify-center">
                  <div className="h-full w-px bg-gradient-to-b from-cyan-400/45 via-blue-400/35 to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
