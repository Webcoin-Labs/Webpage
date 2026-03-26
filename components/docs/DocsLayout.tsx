import Link from "next/link";
import { ChevronRight, FileText, Search } from "lucide-react";
import { docsNav, getDocsHref, getDocsPage, type DocsBlock, type DocsPage } from "@/lib/docs";

const toneClasses = {
  info: "border-[#2b3150] bg-[#12182a] text-[#c8cffd]",
  tip: "border-[#243b37] bg-[#0f1918] text-[#bcfff1]",
  warn: "border-[#4b2f2f] bg-[#1b1214] text-[#ffd7d7]",
} as const;

function DocsSidebar({ page }: { page: DocsPage }) {
  const currentKey = page.slug.join("/");

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] overflow-y-auto rounded-[28px] border border-[#1e2126] bg-[#0a0c0e] xl:block">
      <div className="border-b border-[#1e2126] px-5 py-5">
        <Link href="/app/docs" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c6ef7] text-sm font-semibold text-white">W</span>
          <div>
            <p className="text-sm font-semibold text-[#f0eeff]">Webcoin Labs</p>
            <p className="text-xs text-[#7a7d8a]">Documentation</p>
          </div>
        </Link>
        <button type="button" className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#1e2126] bg-[#12151a] px-4 py-3 text-left text-sm text-[#7a7d8a]">
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search docs...
          </span>
          <span className="rounded-md border border-[#262a31] px-2 py-0.5 text-[11px] text-[#a89ef5]">Cmd K</span>
        </button>
      </div>
      <div className="px-4 py-4">
        {docsNav.map((group) => {
          const open = group.items.some((item) => item.slug.join("/") === currentKey);
          return (
            <details key={group.label} open={open} className="border-b border-[#15181c] py-4 last:border-b-0">
              <summary className="cursor-pointer list-none px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7d8a]">{group.label}</summary>
              <nav className="mt-3 space-y-1">
                {group.items.map((item) => {
                  const active = item.slug.join("/") === currentKey;
                  return (
                    <Link
                      key={item.label}
                      href={getDocsHref(item.slug)}
                      className={`block rounded-r-2xl border-l-2 px-3 py-2.5 text-sm transition ${
                        active ? "border-[#7c6ef7] bg-[#151121] text-[#f0eeff]" : "border-transparent text-[#8f93a3] hover:bg-[#12151a] hover:text-[#f0eeff]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </details>
          );
        })}
      </div>
    </aside>
  );
}

function Breadcrumbs({ page }: { page: DocsPage }) {
  const segments =
    page.slug.length === 0
      ? [
          { label: "Docs", href: "/app/docs" },
          { label: "Getting Started", href: "/app/docs" },
          { label: "Overview", href: "/app/docs" },
        ]
      : [
          { label: "Docs", href: "/app/docs" },
          { label: page.group, href: getDocsHref(page.slug.slice(0, page.slug.length - 1)) },
          { label: page.navLabel, href: getDocsHref(page.slug) },
        ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#7a7d8a]">
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-[#4c5060]" /> : null}
          <Link href={segment.href} className={index === segments.length - 1 ? "text-[#a89ef5]" : "hover:text-[#f0eeff]"}>
            {segment.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: DocsBlock }) {
  if (block.type === "paragraphs") {
    return <div className="space-y-4">{block.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-[#a7abba]">{paragraph}</p>)}</div>;
  }
  if (block.type === "callout") {
    return (
      <div className={`rounded-3xl border p-5 ${toneClasses[block.tone]}`}>
        <p className="text-sm font-semibold">{block.title}</p>
        <p className="mt-2 text-sm leading-7 opacity-90">{block.body}</p>
      </div>
    );
  }
  if (block.type === "cardGrid") {
    const cols = block.columns === 4 ? "xl:grid-cols-4" : block.columns === 3 ? "xl:grid-cols-3" : "xl:grid-cols-2";
    return (
      <div className={`grid gap-4 md:grid-cols-2 ${cols}`}>
        {block.items.map((item) => (
          <div key={item.title} className="rounded-[28px] border border-[#1e2126] bg-[#12151a] p-5">
            {item.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a89ef5]">{item.eyebrow}</p> : null}
            <p className="mt-3 text-lg font-semibold text-[#f0eeff]">{item.title}</p>
            <p className="mt-3 text-sm leading-7 text-[#7a7d8a]">{item.description}</p>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "steps") {
    return (
      <div className="space-y-4">
        {block.items.map((item, index) => (
          <div key={item.title} className="flex gap-4 rounded-[28px] border border-[#1e2126] bg-[#12151a] p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#332f62] bg-[#171428] text-sm font-semibold text-[#a89ef5]">{index + 1}</div>
            <div>
              <p className="text-base font-semibold text-[#f0eeff]">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "bulletList") {
    return <div className="space-y-3">{block.items.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-[#1e2126] bg-[#12151a] px-4 py-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7c6ef7]" /><p className="text-sm leading-7 text-[#a7abba]">{item}</p></div>)}</div>;
  }
  if (block.type === "routeMap") {
    return <div className="overflow-hidden rounded-[28px] border border-[#1e2126] bg-[#12151a]">{block.routes.map((route) => <div key={route.path} className="border-b border-[#1e2126] px-5 py-4 last:border-b-0"><p className="font-mono text-sm text-[#f0eeff]">{route.path}</p><p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{route.description}</p></div>)}</div>;
  }
  if (block.type === "integrationGrid") {
    return <div className="grid gap-4 lg:grid-cols-2">{block.items.map((item) => <div key={item.name} className="rounded-[28px] border border-[#1e2126] bg-[#12151a] p-5"><div className="flex items-center justify-between gap-3"><p className="text-base font-semibold text-[#f0eeff]">{item.name}</p><span className="rounded-full border border-[#2a2f39] px-3 py-1 text-[11px] text-[#a89ef5]">Integration</span></div><p className="mt-3 text-sm leading-7 text-[#a7abba]">{item.powers}</p><p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#7a7d8a]">{item.state}</p></div>)}</div>;
  }
  if (block.type === "comparison") {
    return <div className="space-y-3">{block.items.map((item) => <div key={item.label} className="grid gap-3 rounded-[28px] border border-[#1e2126] bg-[#12151a] p-5 lg:grid-cols-[220px_1fr]"><p className="text-sm font-semibold text-[#f0eeff]">{item.label}</p><p className="text-sm leading-7 text-[#a7abba]">{item.value}</p></div>)}</div>;
  }
  if (block.type === "schemaList") {
    return <div className="space-y-4">{block.items.map((item) => <div key={item.name} className="rounded-[28px] border border-[#1e2126] bg-[#12151a] p-5"><p className="text-base font-semibold text-[#f0eeff]">{item.name}</p><p className="mt-2 text-sm leading-7 text-[#a7abba]">{item.description}</p><div className="mt-4 flex flex-wrap gap-2">{item.fields.map((field) => <span key={field} className="rounded-full border border-[#2a2f39] bg-[#0d0f12] px-3 py-1 text-xs text-[#a89ef5]">{field}</span>)}</div></div>)}</div>;
  }

  const diagram = block.diagram;
  return (
    <div className="rounded-[28px] border border-[#1e2126] bg-[#11141a] p-5">
      {block.title ? <p className="text-sm font-semibold text-[#f0eeff]">{block.title}</p> : null}
      {diagram.kind === "hub" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px_1fr]">
          <div className="grid gap-4">{diagram.nodes.slice(0, 2).map((node) => <div key={node.title} className="rounded-3xl border border-[#262a31] bg-[#0d0f12] p-4"><p className="text-sm font-semibold text-[#f0eeff]">{node.title}</p><p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{node.description}</p></div>)}</div>
          <div className="flex items-center"><div className="w-full rounded-[32px] border border-[#403a7b] bg-[radial-gradient(circle_at_top,#2b235a,transparent_55%),#141821] p-6 text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a89ef5]">Core</p><p className="mt-3 text-lg font-semibold text-[#f0eeff]">{diagram.center.title}</p><p className="mt-3 text-sm leading-7 text-[#9fa3b8]">{diagram.center.description}</p></div></div>
          <div className="grid gap-4">{diagram.nodes.slice(2).map((node) => <div key={node.title} className="rounded-3xl border border-[#262a31] bg-[#0d0f12] p-4"><p className="text-sm font-semibold text-[#f0eeff]">{node.title}</p><p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{node.description}</p></div>)}</div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">{diagram.nodes.map((node, index) => <div key={node.title} className="relative rounded-3xl border border-[#262a31] bg-[#0d0f12] p-4"><span className="absolute right-4 top-4 rounded-full border border-[#2a2f39] px-2 py-0.5 text-[11px] text-[#a89ef5]">0{index + 1}</span><p className="pr-12 text-sm font-semibold text-[#f0eeff]">{node.title}</p><p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{node.description}</p></div>)}</div>
      )}
      {block.caption ? <p className="mt-4 text-sm text-[#7a7d8a]">{block.caption}</p> : null}
    </div>
  );
}

export function DocsLayout({ page }: { page: DocsPage }) {
  const nextPages = page.nextSteps.map((slug) => getDocsPage(slug)).filter((item): item is DocsPage => Boolean(item));

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0d0f12] text-[#f0eeff]">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_250px]">
        <DocsSidebar page={page} />
        <div className="min-w-0">
          <div className="rounded-[32px] border border-[#1e2126] bg-[#0d0f12] p-6 md:p-8">
            <Breadcrumbs page={page} />
            <div className="mt-6 border-b border-[#1e2126] pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#24283a] bg-[#12151a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#a89ef5]"><FileText className="h-3.5 w-3.5" />{page.group}</div>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[#f0eeff] md:text-5xl">{page.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-9 text-[#8f93a3]">{page.subtitle}</p>
            </div>
            <div className="mt-8 space-y-10">
              {page.sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-24"><h2 className="mb-5 text-2xl font-semibold text-[#f0eeff]">{section.title}</h2><div className="space-y-5">{section.blocks.map((block, index) => <BlockRenderer key={`${section.id}-${index}`} block={block} />)}</div></section>)}
              <section id="next-steps" className="rounded-[32px] border border-[#1e2126] bg-[#11141a] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7a7d8a]">Next steps</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {nextPages.map((nextPage) => <Link key={nextPage.slug.join("/") || "overview"} href={getDocsHref(nextPage.slug)} className="rounded-[24px] border border-[#1e2126] bg-[#12151a] p-5 transition hover:border-[#7c6ef7]/60"><p className="text-xs uppercase tracking-[0.16em] text-[#a89ef5]">{nextPage.group}</p><p className="mt-3 text-base font-semibold text-[#f0eeff]">{nextPage.title}</p><p className="mt-2 text-sm leading-7 text-[#7a7d8a]">{nextPage.description}</p></Link>)}
                </div>
              </section>
            </div>
          </div>
        </div>
        <aside className="sticky top-6 hidden h-fit rounded-[28px] border border-[#1e2126] bg-[#0d0f12] p-5 2xl:block">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7a7d8a]">On this page</p>
          <nav className="mt-4 space-y-2">
            {page.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block border-l border-transparent pl-3 text-sm text-[#8d91a1] transition hover:border-[#7c6ef7] hover:text-[#f0eeff]">{section.title}</a>)}
            <a href="#next-steps" className="block border-l border-transparent pl-3 text-sm text-[#8d91a1] transition hover:border-[#7c6ef7] hover:text-[#f0eeff]">Next steps</a>
          </nav>
        </aside>
      </div>
    </div>
  );
}
