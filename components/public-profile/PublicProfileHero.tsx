import Link from "next/link";
import { MapPin, Globe } from "lucide-react";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ShareProfileButton } from "@/components/public-profile/ShareProfileButton";

type RoleConfig = {
  accent: string;
  accentDim: string;
  border: string;
  bg: string;
  banner: string;
  label: string;
  dot: string;
};

const ROLE_MAP: Record<string, RoleConfig> = {
  founder: {
    accent: "#a78bfa",
    accentDim: "#7c3aed",
    border: "rgba(167,139,250,0.25)",
    bg: "rgba(167,139,250,0.08)",
    banner: "linear-gradient(135deg,#1a0e38 0%,#120828 35%,#0b0b12 70%,#0d0d0f 100%)",
    label: "Founder",
    dot: "#7c3aed",
  },
  builder: {
    accent: "#22d3ee",
    accentDim: "#0891b2",
    border: "rgba(34,211,238,0.25)",
    bg: "rgba(34,211,238,0.08)",
    banner: "linear-gradient(135deg,#061519 0%,#0c1e24 35%,#0c1317 70%,#0d0d0f 100%)",
    label: "Builder",
    dot: "#0891b2",
  },
  investor: {
    accent: "#34d399",
    accentDim: "#059669",
    border: "rgba(52,211,153,0.25)",
    bg: "rgba(52,211,153,0.08)",
    banner: "linear-gradient(135deg,#03100a 0%,#071a10 35%,#071210 70%,#0d0d0f 100%)",
    label: "Investor",
    dot: "#059669",
  },
};

const chipColors = {
  amber: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", color: "#fbbf24", dot: "#d97706" },
  green: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", color: "#34d399", dot: "#059669" },
  violet: { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)", color: "#a78bfa", dot: "#7c3aed" },
  cyan: { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)", color: "#22d3ee", dot: "#0891b2" },
  default: { bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)", color: "#a1a1aa", dot: "#52525b" },
};

export function PublicProfileHero({
  role,
  name,
  username,
  image,
  bio,
  headline,
  location,
  statusChips,
  websiteUrl,
  linkedProfileHref,
  linkedProfileLabel,
  sharePath,
}: {
  role: "founder" | "builder" | "investor";
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  statusChips?: { label: string; color?: "amber" | "green" | "violet" | "cyan" | "default" }[];
  websiteUrl?: string | null;
  linkedProfileHref?: string;
  linkedProfileLabel?: string;
  sharePath?: string;
}) {
  const cfg = ROLE_MAP[role];
  const displayName = name || username || "Anonymous";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="overflow-hidden rounded-[18px]" style={{ border: "0.5px solid #1e1e24" }}>
      {/* ─── Banner ─── */}
      <div className="relative h-28 sm:h-32" style={{ background: cfg.banner }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${cfg.accent}06 1px, transparent 1px), linear-gradient(90deg, ${cfg.accent}06 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute -left-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${cfg.accent}14 0%, transparent 60%)`, filter: "blur(20px)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to top, #111114, transparent)" }} />
      </div>

      {/* ─── Body ─── */}
      <div className="px-5 pb-4 sm:px-6" style={{ backgroundColor: "#111114" }}>
        {/* Avatar + Name */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-end gap-3.5">
            <ProfileAvatar
              src={image}
              alt={displayName}
              fallback={initials}
              className="-mt-8 h-16 w-16 shrink-0 overflow-hidden rounded-[14px]"
              fallbackClassName="text-xl font-black"
              style={{
                border: "2px solid #111114",
                boxShadow: `0 0 0 1px ${cfg.border}, 0 2px 12px ${cfg.accent}14`,
                background: `linear-gradient(135deg, ${cfg.accentDim}35, ${cfg.dot}18)`,
                color: cfg.accent,
                letterSpacing: "-0.5px",
              }}
            />
            <div className="pb-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: "#f4f4f5", letterSpacing: "-0.3px" }}>
                  {displayName}
                </h1>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ backgroundColor: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.accent }}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-[12px]" style={{ color: "#52525b" }}>@{username}</p>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
            {linkedProfileHref && linkedProfileLabel ? (
              <Link href={linkedProfileHref}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.accent }}>
                Also {linkedProfileLabel} ↗
              </Link>
            ) : null}
            {websiteUrl ? (
              <a href={websiteUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#71717a" }}>
                <Globe className="h-3 w-3" /> Website
              </a>
            ) : null}
            {sharePath ? <ShareProfileButton path={sharePath} /> : null}
          </div>
        </div>

        {/* Bio */}
        {(bio ?? headline) ? (
          <p className="mt-2.5 max-w-lg text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>
            {bio ?? headline}
          </p>
        ) : null}

        {/* Meta + status row — combined to eliminate vertical gaps */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {location ? (
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#52525b" }}>
              <MapPin className="h-3 w-3" /> {location}
            </span>
          ) : null}
          <Link href="/" className="text-[11px] transition-opacity hover:opacity-80" style={{ color: "#3f3f46" }}>
            webcoinlabs.com
          </Link>
          {/* Status chips inline */}
          {statusChips?.map((chip) => {
            const tone = chipColors[chip.color ?? "default"];
            return (
              <span key={chip.label}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: tone.bg, border: `0.5px solid ${tone.border}`, color: tone.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
