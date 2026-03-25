export function OsPageSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-8 w-64 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-3 w-80 max-w-full animate-pulse rounded bg-muted/40" />
      </section>
      <section className="rounded-2xl border border-border/60 bg-card/70 p-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-8 w-28 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <article key={idx} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-muted/50" />
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="h-48 rounded-xl border border-border/60 bg-card" />
        <article className="h-48 rounded-xl border border-border/60 bg-card" />
      </section>
    </div>
  );
}

