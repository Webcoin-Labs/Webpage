import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, ShieldCheck } from "lucide-react";

export function FounderOsAccessWarning({
  reason = "Founder OS opens only after a founder/company identity is set up.",
}: {
  reason?: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Founder OS locked</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Founder access requires a company-level founder claim</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {reason} You should only enter Founder OS after you either create a company page for your own startup or
            complete a verified founder position for a company you actually represent. Until then, Builder OS remains
            the correct workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/60 bg-background/60 p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-300" />
            <p className="font-semibold text-foreground">Create company page</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add your startup name, founder role, company description, chain focus, and public founder identity first.
            Founder OS will make sense only after that layer exists.
          </p>
          <Link
            href="/app/profile"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
          >
            Complete founder profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <article className="rounded-2xl border border-border/60 bg-background/60 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-300" />
            <p className="font-semibold text-foreground">Company role verification</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If you already work at an existing company, your position needs to be declared on your profile before
            Founder OS should unlock. A deeper LinkedIn-style company-role verification workflow can layer in later, but
            access is intentionally restricted now so Builder users do not land in founder workflows by mistake.
          </p>
          <Link
            href="/app/builder-os"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            Open Builder OS instead
          </Link>
        </article>
      </div>
    </section>
  );
}
