"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Suggestion = {
  module: string;
  title: string;
  desc: string;
  route: string;
  featured?: boolean;
};

const defaultSuggestions: Suggestion[] = [
  {
    module: "Investor Connect",
    title: "Ready to raise?",
    desc: "Add your startup and upload your deck to get discovered by investors.",
    route: "/app/founder-os/investor-connect",
  },
  {
    module: "Tokenomics Studio",
    title: "Design your token model",
    desc: "Generate a tokenomics structure from your venture details and thesis.",
    route: "/app/founder-os/tokenomics",
  },
  {
    module: "Builder Discovery",
    title: "Find your first builder",
    desc: "Post a role or browse builders matched to your stack and stage.",
    route: "/app/founder-os/builder-discovery",
  },
  {
    module: "Pitch Deck AI",
    title: "Improve your deck",
    desc: "Upload your deck and get an investor-readiness score with AI suggestions.",
    route: "/app/founder-os/pitch-deck",
  },
  {
    module: "Launch Readiness",
    title: "Are you launch-ready?",
    desc: "Run a readiness check across product, legal, fundraising, and team.",
    route: "/app/founder-os/launch-readiness",
  },
  {
    module: "Data Room",
    title: "Organize your diligence docs",
    desc: "Investors expect organized data rooms. Set yours up before outreach.",
    route: "/app/founder-os/data-room",
  },
];

export function SmartSuggestionsPanel({
  ventureCount = 0,
}: {
  ventureCount?: number;
}) {
  const suggestions = ventureCount === 0
    ? [{ ...defaultSuggestions[0], featured: true }, ...defaultSuggestions.slice(1)]
    : defaultSuggestions;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % suggestions.length);
  }, [suggestions.length]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [paused, next]);

  const current = suggestions[active];

  return (
    <div>
      <p
        className="mb-3 text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "#3f3f46" }}
      >
        Smart Suggestions
      </p>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Link
          href={current.route}
          className="block rounded-lg p-[11px_12px] transition-all duration-200"
          style={{
            backgroundColor: current.featured ? "#0d0b16" : "#111114",
            border: `0.5px solid ${current.featured ? "#2d1f5e" : "#1e1e24"}`,
          }}
        >
          <p
            className="text-[8px] font-bold uppercase"
            style={{ color: "#5b21b6", letterSpacing: "0.08em" }}
          >
            {current.module}
          </p>
          <p
            className="mt-1 text-[11px] font-semibold"
            style={{ color: "#d4d4d8" }}
          >
            {current.title}
          </p>
          <p
            className="mt-[3px] text-[9px] leading-[1.4]"
            style={{ color: "#52525b" }}
          >
            {current.desc}
          </p>
          <p
            className="mt-[7px] text-[9px] font-semibold"
            style={{ color: "#a78bfa" }}
          >
            Open {current.module} →
          </p>
        </Link>
        {/* Dot nav */}
        <div className="mt-2 flex items-center justify-center gap-1">
          {suggestions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="h-[5px] w-[5px] rounded-full transition-colors"
              style={{ backgroundColor: i === active ? "#7c3aed" : "#1e1e24" }}
              aria-label={`Go to suggestion ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
