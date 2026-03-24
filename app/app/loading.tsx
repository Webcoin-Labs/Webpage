export default function AppSectionLoading() {
  return (
    <div className="space-y-6 py-8">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted/60" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl border border-border/50 bg-card/60" />
        <div className="h-28 animate-pulse rounded-xl border border-border/50 bg-card/60" />
        <div className="h-28 animate-pulse rounded-xl border border-border/50 bg-card/60" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border/50 bg-card/60" />
    </div>
  );
}
