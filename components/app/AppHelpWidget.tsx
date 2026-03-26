"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, BookOpen, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

const helpItems = [
  { icon: BookOpen, label: "Docs", href: "/app/docs" },
  { icon: Calendar, label: "Book Demo", href: "/", external: "https://calendly.com/webcoinlabs/demo" },
  { icon: MessageSquare, label: "Request Intro", href: "/app/intros" },
];

export function AppHelpWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all text-muted-foreground hover:text-cyan-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Ask Webcoin Support"
      >
        <MessageCircle className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6"
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
              className="relative w-full max-w-sm rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                <span className="font-semibold text-sm">Ask Webcoin Support</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-1">
                {helpItems.map((item) => {
                  const Icon = item.icon;
                  const href = "external" in item ? (item as { external: string }).external : item.href;
                  const isExternal = "external" in item;
                  return isExternal ? (
                    <a
                      key={item.label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors text-sm"
                    >
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors text-sm"
                    >
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
