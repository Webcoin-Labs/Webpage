"use client";

import { useTransition, useState } from "react";
import { updateRole } from "@/app/actions/settings";
import { Loader2, CheckCircle2 } from "lucide-react";

const ROLES = [
  { value: "BUILDER", label: "Builder" },
  { value: "FOUNDER", label: "Founder" },
  { value: "INVESTOR", label: "Investor" },
] as const;

export function SettingsForm({
  currentRole,
  email,
  name,
}: { currentRole: string; email?: string; name?: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (role: string) => {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateRole(role);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="p-6 rounded-xl border border-border/50 bg-card max-w-md">
      <h2 className="font-semibold mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-4">{name && <span>{name}</span>} {email && <span className="text-muted-foreground">· {email}</span>}</p>

      <h2 className="font-semibold mb-3">Role</h2>
      <p className="text-xs text-muted-foreground mb-3">How you use Webcoin Labs. This affects which features you see.</p>
      <div className="space-y-2">
        {ROLES.map((r) => (
          <label key={r.value} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-cyan-500/30 cursor-pointer transition-colors">
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={currentRole === r.value}
              onChange={() => handleRoleChange(r.value)}
              disabled={isPending}
              className="accent-cyan-500"
            />
            <span className="text-sm font-medium">{r.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-cyan-400 mt-2">
          <CheckCircle2 className="w-4 h-4" /> Role updated. Refresh to see changes.
        </div>
      )}
    </div>
  );
}
