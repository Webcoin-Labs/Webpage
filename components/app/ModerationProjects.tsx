"use client";

import { useTransition, useState } from "react";
import { setProjectVisibility, setProjectVerified } from "@/app/actions/admin";
import type { Project, User } from "@prisma/client";

type ProjectWithOwner = Project & { owner: Pick<User, "name" | "email"> };

export function ModerationProjects({ projects }: { projects: ProjectWithOwner[] }) {
  const [isPending, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggle = (id: string, action: "visibility" | "verified", value: boolean) => {
    setUpdating(id);
    startTransition(async () => {
      if (action === "visibility") await setProjectVisibility(id, value);
      else await setProjectVerified(id, value);
      setUpdating(null);
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Projects</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-border/50 bg-card flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.owner.name ?? p.owner.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.publicVisible}
                    disabled={isPending && updating === p.id}
                    onChange={(e) => toggle(p.id, "visibility", e.target.checked)}
                    className="rounded"
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.verifiedByWebcoinLabs}
                    disabled={isPending && updating === p.id}
                    onChange={(e) => toggle(p.id, "verified", e.target.checked)}
                    className="rounded"
                  />
                  Verified
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
