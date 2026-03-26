"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

const menuGroups = [
  {
    label: "Products",
    items: [
      { href: "/products/founder-profile", title: "Founder Profile", desc: "Identity and network layer" },
      { href: "/products/arcpay", title: "ArcPay", desc: "Payments infrastructure" },
      { href: "/app", title: "Arc Builder Card", desc: "SBT identity and mint flow" },
      { href: "/products/kreatorboard", title: "Kreatorboard", desc: "Creator operations dashboard" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { href: "/builders", title: "For Builders", desc: "Discover projects and collaborators" },
      { href: "/projects", title: "For Founders", desc: "Publish and grow your project" },
      { href: "/network", title: "Ecosystem Access", desc: "Partners, launchpads, exchanges" },
      { href: "/services", title: "Studio Support", desc: "Build, fund, distribute" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/insights", title: "Insights", desc: "Articles and market notes" },
      { href: "/pitchdeck", title: "Pitch Decks", desc: "Company and network decks" },
      { href: "/webcoin-labs-2-0", title: "Webcoin Labs 2.0", desc: "Vision and platform story" },
      { href: "/contact", title: "Contact", desc: "Talk to the team" },
    ],
  },
];

const simpleLinks = [
  { href: "/network", label: "Network" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const openCalendly = useCalendly();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mobileLinks = [
    ...menuGroups.flatMap((group) => group.items.map((item) => ({ href: item.href, label: item.title }))),
    ...simpleLinks,
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl shadow-sm"
          : "backdrop-blur-md"
      )}
      style={{
        backgroundColor: scrolled ? "rgba(9,9,11,0.92)" : "rgba(9,9,11,0.75)",
        borderBottom: scrolled ? "0.5px solid var(--border-subtle)" : "0.5px solid transparent",
      }}
    >
      <nav
        className="container mx-auto px-6 h-[64px] flex items-center justify-between"
        onMouseLeave={() => setActiveDropdown(null)}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Webcoin Labs home">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold text-white"
            style={{ backgroundColor: "var(--accent-color)" }}
          >
            W
          </div>
          <span className="text-[14px] font-semibold hidden sm:inline" style={{ color: "var(--text-primary)" }}>
            Webcoin Labs
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {menuGroups.map((group) => {
            const isOpen = activeDropdown === group.label;
            return (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.label)}
              >
                <button
                  type="button"
                  className={cn(
                    "px-3 py-2 rounded-[var(--radius-md)] text-[13px] font-medium transition-colors inline-flex items-center gap-1",
                    isOpen
                      ? "text-[var(--text-primary)] bg-[var(--bg-hover)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  {group.label}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-[420px] rounded-xl p-2"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "0.5px solid var(--border-subtle)",
                        boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--bg-hover)]"
                          >
                            <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {simpleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-[var(--radius-md)] text-[13px] font-medium transition-colors",
                pathname === link.href
                  ? "text-[var(--text-primary)] bg-[var(--bg-hover)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={openCalendly}
            className="px-3 py-1.5 text-[13px] font-medium transition-colors rounded-[var(--radius-md)]"
            style={{ color: "var(--text-muted)" }}
          >
            Talk to sales
          </button>
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className="px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-medium text-white transition-colors flex items-center gap-1.5"
                style={{
                  backgroundColor: "var(--accent-color)",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.5)",
                }}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Launch App
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Log in
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-medium text-white transition-colors"
                style={{
                  backgroundColor: "var(--accent-color)",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.5)",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md"
            style={{ color: "var(--text-muted)" }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden backdrop-blur-xl"
            style={{
              backgroundColor: "rgba(9,9,11,0.95)",
              borderBottom: "0.5px solid var(--border-subtle)",
            }}
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { openCalendly(); setMenuOpen(false); }}
                className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-center"
                style={{ border: "0.5px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                Talk to sales
              </button>
              <div className="pt-2 mt-2 flex flex-col gap-2" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
                {session ? (
                  <>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-white text-center"
                      style={{ backgroundColor: "var(--accent-color)" }}
                    >
                      Launch App
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm text-center hover:bg-[var(--bg-hover)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-white text-center"
                      style={{ backgroundColor: "var(--accent-color)" }}
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
