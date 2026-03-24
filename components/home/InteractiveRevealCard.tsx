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
  cyan: "border-cyan-400/40",
  emerald: "border-emerald-400/40",
  violet: "border-violet-400/40",
  amber: "border-amber-400/40",
  blue: "border-blue-400/40",
};

const accentHeaderStyles = {
  cyan: "from-cyan-400/10 to-transparent",
  emerald: "from-emerald-400/10 to-transparent",
  violet: "from-violet-400/10 to-transparent",
  amber: "from-amber-400/10 to-transparent",
  blue: "from-blue-400/10 to-transparent",
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
  const headerTint = accentHeaderStyles[accentColor];

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
        bg-card transition-all duration-300
        ${expanded ? `${accent} shadow-[0_12px_40px_-22px_rgba(15,23,42,0.75)]` : "border-border/70"}
        ${expanded || isHovered ? "translate-y-[-2px]" : "translate-y-0"}
        ${className}
      `}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${headerTint}`} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(148,163,184,0.04),transparent_45%)]" />
      {backgroundIllustration && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
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
        <div className="p-6 min-h-[156px] flex flex-col relative z-10">
          {isProblem ? (
            <>
              <div className="flex items-start gap-3">
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
                  className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-foreground shrink-0 border border-border/70"
                >
                  {props.icon}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {props.shortTitle}
                  </h3>
                  {props.sublabel && (
                    <p className="text-sm text-muted-foreground mt-1.5">{props.sublabel}</p>
                  )}
                </div>
                {backgroundIllustration ? (
                  <div className="hidden md:block h-14 w-24 shrink-0 rounded-lg border border-border/70 bg-gradient-to-b from-background/60 to-background/20 p-1 overflow-hidden">
                    <div className="h-full w-full opacity-100 [filter:contrast(1.15)_brightness(1.15)]">
                      {backgroundIllustration}
                    </div>
                  </div>
                ) : null}
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
                    <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/70 leading-relaxed">
                      {detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <span className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
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
                    <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/70 leading-relaxed">
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
