"use client";

import { cn } from "@/lib/utils";

type AffiliationVariant = "default" | "founder" | "independent" | "available";

const variantClasses: Record<AffiliationVariant, string> = {
  default: "border-cyan-500/35 bg-gradient-to-r from-cyan-500/16 to-blue-500/12 text-cyan-100",
  founder: "border-emerald-500/35 bg-gradient-to-r from-emerald-500/16 to-cyan-500/12 text-emerald-100",
  independent: "border-slate-300/30 bg-gradient-to-r from-slate-500/16 to-slate-400/10 text-slate-100",
  available: "border-blue-500/35 bg-gradient-to-r from-blue-500/16 to-cyan-500/10 text-blue-100",
};

interface ProfileAffiliationTagProps {
  label?: string | null;
  title?: string;
  variant?: AffiliationVariant;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
} as const;

export function ProfileAffiliationTag({
  label,
  title,
  variant = "default",
  size = "md",
  className,
}: ProfileAffiliationTagProps) {
  if (!label) return null;

  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-[0.01em] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
