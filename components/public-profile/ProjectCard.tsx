import { ExternalLink, Github } from "lucide-react";

export function ProjectCard({
  title,
  tagline,
  techStack,
  githubUrl,
  liveUrl,
}: {
  title: string;
  tagline?: string | null;
  techStack?: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
}) {
  const initial = (title[0] ?? "P").toUpperCase();

  return (
    <article
      className="flex gap-4 rounded-[16px] p-4 transition-colors hover:brightness-110"
      style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}
    >
      {/* Icon */}
      <div
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[16px] font-bold"
        style={{
          background: "linear-gradient(135deg,#061519,#0c1e24)",
          border: "0.5px solid rgba(34,211,238,0.2)",
          color: "#22d3ee",
        }}
      >
        {initial}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold" style={{ color: "#e4e4e7" }}>{title}</p>
        {tagline ? (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-5" style={{ color: "#71717a" }}>{tagline}</p>
        ) : null}

        {/* Stack chips */}
        {techStack && techStack.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {techStack.slice(0, 7).map((tech) => (
              <span
                key={tech}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.15)", color: "#22d3ee" }}
              >
                {tech}
              </span>
            ))}
            {techStack.length > 7 ? (
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: "#3f3f46" }}>
                +{techStack.length - 7} more
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Links */}
        {(githubUrl || liveUrl) ? (
          <div className="mt-2.5 flex gap-3">
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                style={{ color: "#a1a1aa" }}
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            ) : null}
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                style={{ color: "#22d3ee" }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
