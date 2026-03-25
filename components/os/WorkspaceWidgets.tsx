import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
    </article>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
        tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
        tone === "neutral" && "border-border/60 bg-card text-muted-foreground",
      )}
    >
      {tone === "good" ? <CheckCircle2 className="h-3 w-3" /> : tone === "warn" ? <AlertTriangle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function ActivityTimeline({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary?: string }>;
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative pl-4">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-cyan-400/80" />
              <p className="text-sm">{item.primary}</p>
              {item.secondary ? <p className="text-xs text-muted-foreground">{item.secondary}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function EmptyStateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-border/70 bg-card p-6">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  );
}

