"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOVER_LEAVE_DELAY_MS = 400;
const TRANSITION_MS = 220;

export type RevealCardVariant = "problem" | "capability";

type BaseProps = {
  detail: string;
  accentColor?: "cyan" | "emerald" | "violet" | "amber" | "blue";
  className?: string;
  backgroundIllustration?: ReactNode;
};

type ProblemCardProps = BaseProps & {
  variant: "problem";
  icon: ReactNode;
  shortTitle: string;
  sublabel?: string;
};

type CapabilityCardProps = BaseProps & {
  variant: "capability";
  word: string;
};

export type InteractiveRevealCardProps = ProblemCardProps | CapabilityCardProps;

const accentStyles = {
  cyan: "border-cyan-400/30 shadow-[0_0_30px_-10px_rgba(34,211,238,0.28)]",
  emerald: "border-emerald-400/30 shadow-[0_0_30px_-10px_rgba(52,211,153,0.28)]",
  violet: "border-violet-400/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.28)]",
  amber: "border-amber-400/30 shadow-[0_0_30px_-10px_rgba(245,158,11,0.28)]",
  blue: "border-blue-400/30 shadow-[0_0_30px_-10px_rgba(59,130,246,0.28)]",
};

export function InteractiveRevealCard(props: InteractiveRevealCardProps) {
  const { detail, accentColor = "cyan", className = "", backgroundIllustration } = props;
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveTimeout = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearLeaveTimeout();
    setExpanded(true);
  }, [clearLeaveTimeout]);

  const close = useCallback(() => {
    clearLeaveTimeout();
    setExpanded(false);
  }, [clearLeaveTimeout]);

  const scheduleClose = useCallback(() => {
    clearLeaveTimeout();
    leaveTimeoutRef.current = setTimeout(() => setExpanded(false), HOVER_LEAVE_DELAY_MS);
  }, [clearLeaveTimeout]);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
    clearLeaveTimeout();
  }, [clearLeaveTimeout]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  const accent = accentStyles[accentColor];

  const isProblem = props.variant === "problem";
  const triggerId = isProblem
    ? `problem-trigger-${props.shortTitle.replace(/\s+/g, "-").toLowerCase()}`
    : `capability-trigger-${props.word}`;
  const panelId = isProblem
    ? `problem-detail-${props.shortTitle.replace(/\s+/g, "-").toLowerCase()}`
    : `capability-detail-${props.word}`;

  return (
    <motion.article
      layout
      initial={false}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative rounded-2xl border overflow-hidden isolate
        bg-gradient-to-b from-slate-900/85 via-slate-950/90 to-slate-950/95 backdrop-blur-sm
        transition-all duration-300
        ${expanded ? `border-opacity-100 ${accent}` : "border-border hover:border-border/80"}
        ${expanded || isHovered ? "translate-y-[-3px] scale-[1.01]" : "translate-y-0 scale-100"}
        ${className}
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_15%,rgba(56,189,248,0.08),transparent_70%)]" />
      {backgroundIllustration && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          {backgroundIllustration}
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        aria-controls={panelId}
        id={triggerId}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
      >
        <div className="p-6 min-h-[136px] flex flex-col relative z-10">
          {isProblem ? (
            <>
              <div className="flex items-start gap-4">
                <motion.div
                  animate={
                    expanded || isHovered
                      ? {
                          boxShadow: "0 0 18px rgba(34,211,238,0.35)",
                          scale: 1.04,
                        }
                      : { boxShadow: "0 0 0 rgba(0,0,0,0)", scale: 1 }
                  }
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0 border border-cyan-500/30"
                >
                  {props.icon}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {props.shortTitle}
                  </h3>
                  {props.sublabel && (
                    <p className="text-xs text-slate-300/80 mt-1">{props.sublabel}</p>
                  )}
                </div>
              </div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: TRANSITION_MS / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-300 mt-4 pt-4 border-t border-slate-700/70 leading-relaxed">
                      {detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {props.word}
              </span>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: TRANSITION_MS / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-300 mt-4 pt-4 border-t border-slate-700/70 leading-relaxed">
                      {detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </button>
    </motion.article>
  );
}
