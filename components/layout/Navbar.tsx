"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, LayoutDashboard, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useCalendly } from "@/components/providers/CalendlyProvider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/network", label: "Network" },
  { href: "/builders", label: "Builders" },
  { href: "/projects", label: "Projects" },
  { href: "/insights", label: "Insights" },
  { href: "/pitchdeck", label: "Pitch Deck" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const openCalendly = useCalendly();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/50"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-bold text-lg tracking-tight">
            Webcoin <span className="gradient-text">Labs</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={openCalendly}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:border-cyan-500/40 text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book Demo
          </button>
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm font-medium border border-cyan-500/20 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Launch App
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
                Sign In
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Launch App
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
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
                className="px-4 py-2.5 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Book Demo
              </button>
              <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                {session ? (
                  <>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium text-center"
                    >
                      Launch App
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground text-center"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground text-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/app"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold text-center"
                    >
                      Launch App
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
