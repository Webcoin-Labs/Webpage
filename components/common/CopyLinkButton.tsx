"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onCopy = () => {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopied(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-60"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}
