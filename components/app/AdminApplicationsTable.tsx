"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatus } from "@/app/actions/admin";
import type { Prisma } from "@prisma/client";

type ApplicationWithUser = Prisma.ApplicationGetPayload<{
    include: { user: { select: { name: true; email: true; image: true } } };
}>;

const statusColors: Record<string, string> = {
    NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    REVIEWING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ACCEPTED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AdminApplicationsTable({ applications }: { applications: ApplicationWithUser[] }) {
    const [isPending, startTransition] = useTransition();
    const [updating, setUpdating] = useState<string | null>(null);

    const handleStatusChange = (id: string, status: string) => {
        setUpdating(id);
        startTransition(async () => {
            await updateApplicationStatus(id, status);
            setUpdating(null);
        });
    };

    if (applications.length === 0) {
        return <p className="text-sm text-muted-foreground py-6">No applications yet.</p>;
    }

    return (
        <div className="space-y-3">
            {applications.map((app) => {
                const answers = app.answers as Record<string, string>;
                return (
                    <div key={app.id} className="p-5 rounded-xl border border-border/50 bg-card">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm">{app.user.name ?? app.user.email}</p>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">{app.type.replace("_", " ")}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(app.createdAt).toLocaleDateString()} — {app.user.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[app.status]}`}>
                                    {app.status}
                                </span>
                                <select
                                    disabled={isPending && updating === app.id}
                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                    defaultValue={app.status}
                                    className="text-xs px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                                >
                                    <option value="NEW">New</option>
                                    <option value="REVIEWING">Reviewing</option>
                                    <option value="ACCEPTED">Accept</option>
                                    <option value="REJECTED">Reject</option>
                                </select>
                            </div>
                        </div>
                        {answers?.why && (
                            <p className="text-xs text-muted-foreground mt-3 border-t border-border/50 pt-3 line-clamp-2">
                                {answers.why}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
