import Link from "next/link";
import { docsNavGroups, docsBySlug, type DocSection } from "@/lib/docs";

export function DocsChrome({
  currentSlug,
  toc,
  children,
}: {
  currentSlug?: string;
  toc: DocSection[];
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_240px]">
      <aside className="h-fit rounded-xl border border-border/60 bg-card p-4 xl:sticky xl:top-20">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Documentation</p>
        <div className="mt-3 space-y-4">
          {docsNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{group.label}</p>
              <div className="space-y-1">
                {group.slugs.map((slug) => {
                  const page = docsBySlug[slug];
                  if (!page) return null;
                  const active = currentSlug === slug;
                  return (
                    <Link
                      key={slug}
                      href={`/app/docs/${slug}`}
                      className={`block rounded-md border px-2 py-1.5 text-sm ${
                        active
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                          : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/20 hover:text-foreground"
                      }`}
                    >
                      {page.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="space-y-4">{children}</main>

      <aside className="h-fit rounded-xl border border-border/60 bg-card p-4 xl:sticky xl:top-20">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">On This Page</p>
        <div className="mt-2 space-y-1">
          {toc.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block rounded-md border border-transparent px-2 py-1.5 text-sm text-muted-foreground hover:border-border/60 hover:bg-accent/20 hover:text-foreground"
            >
              {section.title}
            </a>
          ))}
        </div>
      </aside>
    </section>
  );
}
