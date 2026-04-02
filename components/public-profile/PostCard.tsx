const postTypeColors: Record<string, { bg: string; color: string; label: string }> = {
  LAUNCH: { bg: "rgba(16,185,129,0.08)", color: "#34d399", label: "Launch" },
  HIRING: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24", label: "Hiring" },
  FUNDING: { bg: "rgba(167,139,250,0.08)", color: "#a78bfa", label: "Funding" },
  UPDATE: { bg: "rgba(96,165,250,0.08)", color: "#60a5fa", label: "Update" },
  PROJECT: { bg: "rgba(34,211,238,0.08)", color: "#22d3ee", label: "Project" },
  THESIS: { bg: "rgba(52,211,153,0.08)", color: "#34d399", label: "Thesis" },
  GENERAL: { bg: "rgba(113,113,122,0.08)", color: "#71717a", label: "Post" },
};

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PostCard({
  postType,
  title,
  body,
  createdAt,
}: {
  postType: string;
  title: string;
  body?: string | null;
  createdAt: Date | string;
}) {
  const tone = postTypeColors[postType] ?? postTypeColors.GENERAL;

  return (
    <article
      className="rounded-[14px] p-4 space-y-2"
      style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ backgroundColor: tone.bg, color: tone.color }}
        >
          {tone.label}
        </span>
        <span className="text-[11px]" style={{ color: "#3f3f46" }}>
          {formatDate(createdAt)}
        </span>
      </div>
      <p
        className="text-[13px] font-semibold leading-5"
        style={{ color: "#d4d4d8" }}
      >
        {title}
      </p>
      {body ? (
        <p
          className="line-clamp-2 text-[12px] leading-5"
          style={{ color: "#71717a" }}
        >
          {body}
        </p>
      ) : null}
    </article>
  );
}
