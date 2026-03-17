"use client";

import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { getBuilderAffiliation } from "@/lib/affiliation";

type IntroRequestItem = {
  id: string;
  type: string;
  status: string;
  requestPayload: unknown;
  createdAt: Date;
  sourceProject?: { name: string } | null;
  targetUser?: {
    name?: string | null;
    email?: string | null;
    builderProfile?: { affiliation?: string | null; independent?: boolean | null; openToWork?: boolean | null } | null;
  } | null;
  targetPartner?: { name: string } | null;
  contextSummary?: string | null;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REVIEWING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MATCHED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

export function IntroRequestsList({ requests }: { requests: IntroRequestItem[] }) {
  if (requests.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-border/50 rounded-xl">
        <p className="font-medium mb-1">No intro requests yet</p>
        <p className="text-sm text-muted-foreground mb-4">Create a request to get matched with KOL or VC intros.</p>
        <a href="/app/intros/new" className="text-sm text-cyan-400 hover:text-cyan-300">New request →</a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const payload = req.requestPayload as Record<string, string>;
        const targetBuilderTag = req.targetUser ? getBuilderAffiliation(req.targetUser.builderProfile) : null;
        return (
          <div key={req.id} className="p-5 rounded-xl border border-border/50 bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">{req.type}</span>
                <p className="text-sm mt-1">
                  {req.type === "KOL" && payload?.category && <span>Category: {payload.category}</span>}
                  {req.type === "KOL" && payload?.budgetRange && <span> · Budget: {payload.budgetRange}</span>}
                  {req.type === "VC" && payload?.category && <span>Category: {payload.category}</span>}
                  {req.type === "VC" && payload?.stage && <span> · Stage: {payload.stage}</span>}
                  {req.type === "VC" && payload?.region && <span> · Region: {payload.region}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(req.createdAt).toLocaleDateString()}</p>
                {(req.sourceProject || req.targetUser || req.targetPartner) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {req.sourceProject ? <span>Project: {req.sourceProject.name}</span> : null}
                    {req.targetUser ? (
                      <span className="inline-flex items-center gap-1.5">
                        Builder: {req.targetUser.name ?? req.targetUser.email ?? "Unknown"}
                        {targetBuilderTag ? <ProfileAffiliationTag label={targetBuilderTag.label} variant={targetBuilderTag.variant} /> : null}
                      </span>
                    ) : null}
                    {req.targetPartner ? <span>Partner: {req.targetPartner.name}</span> : null}
                  </div>
                ) : null}
                {req.contextSummary ? (
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{req.contextSummary}</p>
                ) : null}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[req.status] ?? "bg-muted"}`}>
                {req.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
