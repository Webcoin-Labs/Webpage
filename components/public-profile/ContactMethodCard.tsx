import {
  Github,
  Globe,
  Linkedin,
  Mail,
  MessageCircle,
  Twitter,
  ArrowUpRight,
} from "lucide-react";

const PLATFORM_META: Record<
  string,
  { icon: typeof Globe; label: string; description: string; accent: string; bg: string; border: string }
> = {
  TELEGRAM: {
    icon: MessageCircle,
    label: "Telegram",
    description: "Best for direct startup discussions",
    accent: "#22d3ee",
    bg: "rgba(34,211,238,0.06)",
    border: "rgba(34,211,238,0.15)",
  },
  LINKEDIN: {
    icon: Linkedin,
    label: "LinkedIn",
    description: "Professional background and network",
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.15)",
  },
  EMAIL: {
    icon: Mail,
    label: "Email",
    description: "Direct contact for formal outreach",
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  TWITTER: {
    icon: Twitter,
    label: "X / Twitter",
    description: "Public updates and ecosystem activity",
    accent: "#e4e4e7",
    bg: "rgba(228,228,231,0.04)",
    border: "rgba(228,228,231,0.1)",
  },
  GITHUB: {
    icon: Github,
    label: "GitHub",
    description: "Open source work and proof of code",
    accent: "#a1a1aa",
    bg: "rgba(161,161,170,0.06)",
    border: "rgba(161,161,170,0.14)",
  },
  WEBSITE: {
    icon: Globe,
    label: "Website",
    description: "Official project or personal site",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
  DISCORD: {
    icon: MessageCircle,
    label: "Discord",
    description: "Community and direct messaging",
    accent: "#818cf8",
    bg: "rgba(129,140,248,0.06)",
    border: "rgba(129,140,248,0.15)",
  },
};

export function ContactMethodCard({
  type,
  label,
  href,
}: {
  type: string;
  label: string;
  href: string;
}) {
  const meta = PLATFORM_META[type.toUpperCase()] ?? {
    icon: Globe,
    label,
    description: "External contact method",
    accent: "#52525b",
    bg: "rgba(82,82,91,0.06)",
    border: "rgba(82,82,91,0.15)",
  };
  const Icon = meta.icon;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-[14px] p-3.5 transition-all hover:brightness-110"
      style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}
    >
      {/* Icon swatch */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: meta.bg, border: `0.5px solid ${meta.border}` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: meta.accent, width: 18, height: 18 }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-4" style={{ color: "#d4d4d8" }}>
          {meta.label}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-4" style={{ color: "#52525b" }}>
          {meta.description}
        </p>
      </div>

      {/* Arrow */}
      <ArrowUpRight
        className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ color: meta.accent }}
      />
    </a>
  );
}
