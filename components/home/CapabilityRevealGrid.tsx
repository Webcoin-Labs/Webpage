"use client";

import { motion } from "framer-motion";

const workflowSteps = [
  {
    number: "01",
    title: "Create Profile",
    description: "Set your role, chain focus, skills, and startup context.",
  },
  {
    number: "02",
    title: "Build Project",
    description: "Turn ideas into a visible startup and collaboration-ready project.",
  },
  {
    number: "03",
    title: "AI Pitch Analysis",
    description: "Upload your deck for clarity, positioning, and readiness feedback.",
  },
  {
    number: "04",
    title: "Funding Readiness",
    description: "Improve narrative, GTM gaps, and investor preparedness.",
  },
  {
    number: "05",
    title: "Network Connections",
    description: "Reach builders, partners, and ecosystem operators.",
  },
  {
    number: "06",
    title: "Distribution & Launch",
    description: "Coordinate growth, launch support, and ecosystem access.",
  },
];

export function CapabilityRevealGrid() {
  return (
    <section className="py-24 border-b border-border relative overflow-hidden bg-muted/10">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_56%)]" />
      </div>
      <div className="absolute left-[16%] top-[12%] h-64 w-64 rounded-full bg-blue-500/10 blur-[110px] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="max-w-xl"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Execution workflow</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4 text-foreground leading-[1.08]">
              The operating flow from idea to launch.
            </h2>
            <p className="text-base text-muted-foreground mt-5">
              Structured steps built to reduce founder chaos, compress decisions, and accelerate launch readiness.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="relative rounded-2xl border border-border/70 bg-card p-3 md:p-4 shadow-[0_18px_42px_-28px_rgba(2,6,23,0.9)]"
          >
            <div className="absolute bottom-7 left-7 top-7 w-px bg-gradient-to-b from-blue-300/55 via-blue-300/25 to-transparent md:left-[2.15rem]" />
            <div className="space-y-1.5">
              {workflowSteps.map((step, i) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.04, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group grid h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-transparent px-2.5 md:h-[68px] md:gap-4 md:px-3.5 transition-all hover:border-blue-400/20 hover:bg-blue-500/[0.035]"
                >
                  <div className="relative flex h-9 w-9 items-center justify-center">
                    <span className="absolute h-2.5 w-2.5 rounded-full border border-blue-300/55 bg-background shadow-[0_0_12px_rgba(59,130,246,0.28)]" />
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-300/30 bg-accent font-mono text-[10px] text-foreground">
                      {step.number}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight text-foreground md:text-[15px]">{step.title}</p>
                    <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground md:text-[13px]">
                      {step.description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
