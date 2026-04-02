import { ExternalLink, Layers } from "lucide-react";

export function VentureCard({
  name,
  description,
  stage,
  chain,
  website,
  isHiring,
  isRaising,
}: {
  name: string;
  description?: string | null;
  stage?: string | null;
  chain?: string | null;
  website?: string | null;
  isHiring?: boolean;
  isRaising?: boolean;
}) {
  const initial = (name[0] ?? "V").toUpperCase();

  return (
    <article
      className="group flex gap-4 rounded-[16px] p-4 transition-colors hover:brightness-110"
      style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}
    >
      {/* Logo placeholder */}
      <div
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[16px] font-bold"
        style={{
          background: "linear-gradient(135deg,#1a1030,#120828)",
          border: "0.5px solid rgba(167,139,250,0.2)",
          color: "#a78bfa",
        }}
      >
        {initial}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold leading-5" style={{ color: "#e4e4e7" }}>
              {name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {stage ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "0.5px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}
                >
                  {stage}
                </span>
              ) : null}
              {chain ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: "#1a1a1e", border: "0.5px solid #27272a", color: "#71717a" }}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {chain}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {isRaising ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "rgba(52,211,153,0.1)", border: "0.5px solid rgba(52,211,153,0.3)", color: "#34d399" }}
              >
                Raising
              </span>
            ) : null}
            {isHiring ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "rgba(251,191,36,0.1)", border: "0.5px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}
              >
                Hiring
              </span>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {description ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-5" style={{ color: "#71717a" }}>
            {description}
          </p>
        ) : null}

        {/* Website */}
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "#a78bfa" }}
          >
            <ExternalLink className="h-3 w-3" />
            {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
