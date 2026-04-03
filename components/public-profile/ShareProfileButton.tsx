"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";

export function ShareProfileButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }, [path]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
      style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#71717a" }}
      title="Copy public profile link"
      aria-label="Copy public profile link"
    >
      <Link2 className="h-3 w-3" />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
