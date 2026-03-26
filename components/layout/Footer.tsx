"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Calendar, ChevronDown, FileText, HelpCircle, LifeBuoy, Rocket, Users } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { cn } from "@/lib/utils";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Products", href: "/products" },
      { label: "Services", href: "/services" },
      { label: "Builders", href: "/builders" },
      { label: "Projects", href: "/projects" },
      { label: "Insights", href: "/insights" },
      { label: "Pitch Deck", href: "/pitchdeck" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Webcoin Labs 2.0", href: "/webcoin-labs-2-0" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Ecosystems", href: "/ecosystems" },
      { label: "Network", href: "/network" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Careers & Programs",
    links: [
      { label: "Open Roles", href: "/app/jobs" },
      { label: "Builder Program", href: "/app/apply/builder-program" },
      { label: "Founder Support", href: "/app/apply/founder-support" },
      { label: "Launch App", href: "/app" },
      { label: "Docs", href: "/app/docs" },
      { label: "Builder Profiles", href: "/builders" },
    ],
  },
];

const faqItems = [
  {
    question: "What does Webcoin Labs actually do?",
    answer:
      "Webcoin Labs gives founders, builders, and investors a shared operating layer across profiles, projects, ecosystem discovery, pitch analysis, tokenomics, and fundraising workflows.",
  },
  {
    question: "Is this just a directory or a real workspace?",
    answer:
      "It is a real workspace. The public network and profiles are one layer, but the product also includes Founder OS, Builder OS, Investor OS, integrations, and AI-assisted execution tools.",
  },
  {
    question: "Who is the platform for?",
    answer:
      "Founders use it to launch and raise, builders use it to prove work and get discovered, and investors use it to review opportunities with more context than a static deck or bio.",
  },
  {
    question: "Do I need to be technical to use it?",
    answer:
      "No. The product is written for both operators and technical users. Workflows like pitch deck review, tokenomics setup, venture readiness, and connector setup are designed to be guided instead of requiring deep technical knowledge.",
  },
  {
    question: "How do careers, jobs, and builder programs fit in?",
    answer:
      "The platform already includes job listings, hiring workflows, applications, and builder program flows, so the footer now links directly into those surfaces instead of leaving them hidden in the app.",
  },
  {
    question: "How do I get help or talk to the team?",
    answer:
      "You can book a call, open the contact page, read the docs, or start directly in the app depending on whether you need sales support, onboarding help, or product documentation.",
  },
];

export function Footer() {
  const openCalendly = useCalendly();
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-base)",
        borderTop: "0.5px solid var(--border-subtle)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 12% 0%, rgba(124,58,237,0.12), transparent 38%), radial-gradient(circle at 86% 100%, rgba(56,189,248,0.08), transparent 36%)",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 py-16">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                W
              </div>
              <div>
                <span className="block font-semibold text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Webcoin Labs
                </span>
                <span className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--accent-soft)" }}>
                  Builder-first venture infrastructure
                </span>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-7" style={{ color: "var(--text-muted)" }}>
              Webcoin Labs helps founders launch faster through a unified network for builders, AI readiness,
              fundraising workflows, and ecosystem execution.
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "Founder OS", icon: Rocket },
                { label: "Builder Network", icon: Users },
                { label: "Pitch Deck AI", icon: FileText },
                { label: "Support", icon: LifeBuoy },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div
            className="grid gap-6 rounded-[24px] p-6 md:grid-cols-3"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  {group.title}
                </p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="group flex items-center justify-between text-sm transition-colors hover:text-[var(--text-primary)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-[24px] p-6"
            style={{
              background:
                "linear-gradient(180deg, rgba(18,21,26,0.96) 0%, rgba(18,21,26,0.84) 100%)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--accent-soft)" }}>
              Start Here
            </p>
            <h3 className="mt-3 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Talk to the team, apply, or launch directly.
            </h3>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Use the path that matches your stage: explore the product, apply to programs, or book a strategy call.
            </p>

            <div className="mt-5 grid gap-3">
              <button
                onClick={openCalendly}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "white",
                  boxShadow: "0 12px 30px -14px rgba(124,58,237,0.6)",
                }}
              >
                <Calendar className="w-4 h-4" />
                Book a Call
              </button>
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--bg-hover)",
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <Rocket className="w-4 h-4" />
                Launch App
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                <BriefcaseBusiness className="w-4 h-4" />
                Contact Team
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" style={{ color: "var(--accent-soft)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Frequently asked questions
            </h3>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={item.question}
                  className="rounded-[20px]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "0.5px solid var(--border-subtle)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform", isOpen ? "rotate-180" : "")}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                        {item.answer}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <div
          className="mt-12 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "0.5px solid var(--border-subtle)" }}
        >
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>(c) 2026 Webcoin Labs. All rights reserved.</span>
            <Link href="/contact" className="hover:text-[var(--text-primary)]">
              Contact
            </Link>
            <Link href="/app/docs" className="hover:text-[var(--text-primary)]">
              Docs
            </Link>
            <Link href="/pricing" className="hover:text-[var(--text-primary)]">
              Pricing
            </Link>
            <Link href="/insights" className="hover:text-[var(--text-primary)]">
              Insights
            </Link>
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Built for founders, builders, investors, and ecosystem operators.
          </div>
        </div>
      </div>
    </footer>
  );
}
