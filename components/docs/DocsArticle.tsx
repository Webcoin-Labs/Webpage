import { FileCode2 } from "lucide-react";
import type { DocSection } from "@/lib/docs";

export function DocsArticle({ sections }: { sections: DocSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <article id={section.id} key={section.id} className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
          <div className="mt-3 space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          {section.bullets && section.bullets.length > 0 ? (
            <div className="mt-4 space-y-2">
              {section.bullets.map((bullet) => (
                <div key={bullet} className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  {bullet}
                </div>
              ))}
            </div>
          ) : null}

          {section.code ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-background/80 p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-xs uppercase tracking-[0.1em] text-cyan-300">
                <FileCode2 className="h-3.5 w-3.5" /> {section.codeTitle ?? "Reference"}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
                <code>{section.code}</code>
              </pre>
            </div>
          ) : null}
        </article>
      ))}
    </>
  );
}
