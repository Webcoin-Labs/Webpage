"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { updateRole } from "@/app/actions/settings";
import { CheckCircle2 } from "lucide-react";

const ROLES = [
  { value: "BUILDER", label: "Builder" },
  { value: "FOUNDER", label: "Founder" },
  { value: "INVESTOR", label: "Investor" },
] as const;

export function SettingsForm({
  currentRole,
  email,
  name,
  username,
  founderProfileLocked,
}: {
  currentRole: string;
  email?: string;
  name?: string;
  username?: string;
  founderProfileLocked?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [usernameValue] = useState(username ? `@${username}` : "");

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
      <p className="text-sm text-muted-foreground mb-2">{name && <span>{name}</span>} {email && <span className="text-muted-foreground">· {email}</span>}</p>
      <p className="mb-4 text-xs text-muted-foreground">Name * and unique username * are required identity fields.</p>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Unique username *</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Your public handle is locked after account creation. Example: <span className="text-foreground">@alex</span>
        </p>
        <div className="flex gap-2">
          <input
            value={usernameValue}
            placeholder="@yourname"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-cyan-500/40"
            disabled
            readOnly
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">If you need a different username, create a new linked account.</p>
      </div>

      <h2 className="font-semibold mb-3">Role</h2>
      <p className="text-xs text-muted-foreground mb-3">How you use Webcoin Labs. This affects which features you see.</p>
      <div className="space-y-2">
        {ROLES.map((r) => (
          <label
            key={r.value}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              founderProfileLocked && currentRole === "FOUNDER" && r.value !== "FOUNDER"
                ? "border-border/60 opacity-60 cursor-not-allowed"
                : "border-border hover:border-cyan-500/30 cursor-pointer"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={currentRole === r.value}
              onChange={() => handleRoleChange(r.value)}
              disabled={isPending || (founderProfileLocked && currentRole === "FOUNDER" && r.value !== "FOUNDER")}
              className="accent-cyan-500"
            />
            <span className="text-sm font-medium">{r.label}</span>
          </label>
        ))}
      </div>
      {founderProfileLocked && currentRole === "FOUNDER" ? (
        <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground mb-1">Founder accounts are locked</div>
          <p>
            This account already has a Founder profile, so the role can’t be changed. If you want a Creator/Builder account,
            create a separate account and link it here.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/login/create-account" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
              Create Creator/Builder account
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/login" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
              Sign in with creator account
            </Link>
          </div>
        </div>
      ) : null}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-cyan-400 mt-2">
          <CheckCircle2 className="w-4 h-4" /> Role updated. Refresh to see changes.
        </div>
      )}
    </div>
  );
}
