"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useCalendly } from "@/components/providers/CalendlyProvider";
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
          ? "bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-background/80 backdrop-blur-md border-b border-transparent"
      )}
    >
      <nav
        className="container mx-auto px-6 h-[76px] flex items-center justify-between"
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Link href="/" className="flex items-center justify-center group" aria-label="Webcoin Labs home">
          <Image src="/logo/webcoinlogo.webp" alt="Webcoin Labs" width={40} height={40} className="rounded-lg" />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
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
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1",
                    isOpen ? "text-foreground bg-accent/70" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {group.label}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 mt-3 w-[460px] rounded-2xl border border-border/80 bg-background/98 backdrop-blur-xl shadow-[0_24px_48px_-28px_rgba(2,6,23,0.85)] p-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-xl p-3 hover:bg-accent/60 transition-colors"
                          >
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
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
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-foreground bg-accent/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={openCalendly}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Talk to sales
          </button>
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-[0_10px_24px_-16px_rgba(37,99,235,0.95)]"
              >
                <LayoutDashboard className="w-4 h-4" />
                Launch App
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                  Log in
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow-[0_10px_24px_-16px_rgba(37,99,235,0.95)]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { openCalendly(); setMenuOpen(false); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent text-center"
              >
                Talk to sales
              </button>
              <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                {session ? (
                  <>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium text-center"
                    >
                      Launch App
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent text-center"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent text-center"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium text-center"
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
