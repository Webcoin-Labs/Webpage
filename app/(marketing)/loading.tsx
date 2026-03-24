export default function MarketingLoading() {
  return (
    <div className="container mx-auto space-y-6 px-6 py-16">
      <div className="h-10 w-72 animate-pulse rounded-md bg-muted/60" />
      <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-muted/50" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl border border-border/50 bg-card/60" />
        <div className="h-40 animate-pulse rounded-xl border border-border/50 bg-card/60" />
        <div className="h-40 animate-pulse rounded-xl border border-border/50 bg-card/60" />
      </div>
    </div>
  );
}
