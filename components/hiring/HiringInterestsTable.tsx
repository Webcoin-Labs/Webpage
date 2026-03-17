"use client";

import { useState, useTransition } from "react";
import { updateHiringInterestStatus } from "@/app/actions/hiring";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

type HiringInterestItem = {
  id: string;
  name: string;
  email: string;
  skills: string;
  portfolioUrl?: string | null;
  message?: string | null;
  status: "NEW" | "REVIEWING" | "CONTACTED" | "ARCHIVED";
  createdAt: Date;
  companyNameSnapshot?: string | null;
  founderNameSnapshot?: string | null;
  founder?: { name?: string | null; email?: string | null } | null;
};

const statusOptions = ["NEW", "REVIEWING", "CONTACTED", "ARCHIVED"] as const;

export function HiringInterestsTable({
  entries,
  emptyText,
}: {
  entries: HiringInterestItem[];
  emptyText: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{entry.name}</p>
                {entry.companyNameSnapshot ? (
                  <ProfileAffiliationTag label={entry.companyNameSnapshot} variant="founder" />
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{entry.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">Skills: {entry.skills}</p>
              {entry.portfolioUrl ? (
                <a href={entry.portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-300">
                  Portfolio link
                </a>
              ) : null}
              {entry.message ? <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{entry.message}</p> : null}
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
                {entry.founder ? ` • Founder: ${entry.founder.name ?? entry.founder.email ?? "Unknown"}` : ""}
              </p>
            </div>
            <select
              defaultValue={entry.status}
              disabled={isPending && updatingId === entry.id}
              onChange={(e) => {
                const value = e.target.value as (typeof statusOptions)[number];
                setUpdatingId(entry.id);
                startTransition(async () => {
                  await updateHiringInterestStatus(entry.id, value);
                  setUpdatingId(null);
                });
              }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
