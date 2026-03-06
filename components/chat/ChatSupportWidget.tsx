"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Search, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";

const helpItems = [
  { icon: BookOpen, label: "Help Center", href: "/insights" },
  { icon: HelpCircle, label: "FAQ", href: "/contact" },
  { icon: Search, label: "Docs", href: "/build" },
];

export function ChatSupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open support"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-end p-4 md:p-6"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    W
                  </div>
                  <span className="font-semibold">Webcoin Labs Support</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  How can we help? Browse resources or get in touch.
                </p>
                {helpItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 mt-4 py-3 rounded-xl bg-cyan-500/15 text-cyan-400 font-medium text-sm border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                >
                  Contact us
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
