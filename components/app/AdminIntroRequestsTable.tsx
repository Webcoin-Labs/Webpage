"use client";

import { useTransition, useState } from "react";
import { updateIntroRequestStatus } from "@/app/actions/admin";
import type { IntroRequest, Partner, Project, User } from "@prisma/client";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { getBuilderAffiliation } from "@/lib/affiliation";

type IntroWithFounder = IntroRequest & {
  founder: Pick<User, "id" | "name" | "email">;
  sourceProject?: Pick<Project, "name"> | null;
  targetUser?: Pick<User, "name" | "email"> & {
    builderProfile?: { affiliation?: string | null; independent?: boolean | null; openToWork?: boolean | null } | null;
  } | null;
  targetPartner?: Pick<Partner, "name"> | null;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REVIEWING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MATCHED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

export function AdminIntroRequestsTable({ requests }: { requests: IntroWithFounder[] }) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = (id: string, status: string) => {
    setUpdatingId(id);
    startTransition(async () => {
      await updateIntroRequestStatus(id, status);
      setUpdatingId(null);
    });
  };

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground py-6">No intro requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const payload = req.requestPayload as Record<string, string>;
        const targetBuilderTag = req.targetUser ? getBuilderAffiliation(req.targetUser.builderProfile) : null;
        return (
          <div key={req.id} className="p-5 rounded-xl border border-border/50 bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">{req.type}</p>
                <p className="text-sm mt-1">{req.founder.name ?? req.founder.email}</p>
                <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</p>
                {payload && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {Object.entries(payload).map(([k, v]) => (
                      <span key={k} className="mr-3">{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{req.contextSummary}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[req.status] ?? "bg-muted"}`}>
                  {req.status}
                </span>
                <select
                  disabled={isPending && updatingId === req.id}
                  onChange={(e) => handleStatusChange(req.id, e.target.value)}
                  defaultValue={req.status}
                  className="text-xs px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="MATCHED">Matched</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
