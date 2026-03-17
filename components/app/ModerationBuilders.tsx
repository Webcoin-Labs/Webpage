"use client";

import { useTransition, useState } from "react";
import { setBuilderVisibility, setBuilderVerified } from "@/app/actions/admin";
import type { BuilderProfile, User } from "@prisma/client";
import { getBuilderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";

type BuilderWithUser = BuilderProfile & {
  user: Pick<User, "name" | "email" | "image" | "imageStorageKey" | "imageMimeType" | "imageSize">;
};

export function ModerationBuilders({ builders }: { builders: BuilderWithUser[] }) {
  const [isPending, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggle = (id: string, action: "visibility" | "verified", value: boolean) => {
    setUpdating(id);
    startTransition(async () => {
      if (action === "visibility") await setBuilderVisibility(id, value);
      else await setBuilderVerified(id, value);
      setUpdating(null);
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Builder profiles</h2>
      {builders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No builder profiles yet.</p>
      ) : (
        <div className="space-y-2">
          {builders.map((b) => {
            const affiliation = getBuilderAffiliation(b);
            return (
            <div key={b.id} className="p-4 rounded-xl border border-border/50 bg-card flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{b.user.name ?? b.user.email}</p>
                  <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} />
                </div>
                <p className="text-xs text-muted-foreground">{b.handle ?? b.id}</p>
                {b.user.image ? (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {b.user.imageStorageKey ? "Uploaded image" : "External image"} • {b.user.imageMimeType ?? "unknown"} • {b.user.imageSize ? `${Math.round(b.user.imageSize / 1024)}KB` : "size n/a"}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b.publicVisible}
                    disabled={isPending && updating === b.id}
                    onChange={(e) => toggle(b.id, "visibility", e.target.checked)}
                    className="rounded"
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b.verifiedByWebcoinLabs}
                    disabled={isPending && updating === b.id}
                    onChange={(e) => toggle(b.id, "verified", e.target.checked)}
                    className="rounded"
                  />
                  Verified
                </label>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
