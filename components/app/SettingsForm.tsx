"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { updateRole } from "@/app/actions/settings";

const roles = [
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
        return;
      }
      setError(result.error);
    });
  };

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-border/50 bg-background/40 p-5">
          <h2 className="mb-4 font-semibold">Profile</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            {name ? <span>{name}</span> : null} {email ? <span className="text-muted-foreground">· {email}</span> : null}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Name and username are your baseline identity fields across every operating system and connector.
          </p>

          <h3 className="mb-2 font-semibold">Unique username</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Your public handle is locked after account creation. Example: <span className="text-foreground">@alex</span>
          </p>
          <input
            value={usernameValue}
            placeholder="@yourname"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-cyan-500/40"
            disabled
            readOnly
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-muted-foreground">If you need a different username, create a new linked account.</p>
        </section>

        <section className="rounded-2xl border border-border/50 bg-background/40 p-5">
          <h2 className="mb-3 font-semibold">Role</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            This sets your default workspace and changes which flows the product prioritizes for you.
          </p>
          <div className="space-y-2">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                  founderProfileLocked && currentRole === "FOUNDER" && role.value !== "FOUNDER"
                    ? "cursor-not-allowed border-border/60 opacity-60"
                    : "cursor-pointer border-border hover:border-cyan-500/30"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={currentRole === role.value}
                  onChange={() => handleRoleChange(role.value)}
                  disabled={isPending || (founderProfileLocked && currentRole === "FOUNDER" && role.value !== "FOUNDER")}
                  className="accent-cyan-500"
                />
                <span className="text-sm font-medium">{role.label}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {founderProfileLocked && currentRole === "FOUNDER" ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">Founder accounts are locked</div>
          <p>
            This account already has a founder profile, so the role cannot be changed. If you want a separate builder account,
            create another account and link it later.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/login/create-account" className="text-blue-300 underline underline-offset-4 hover:text-blue-200">
              Create builder account
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/login" className="text-blue-300 underline underline-offset-4 hover:text-blue-200">
              Sign in with another account
            </Link>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {success ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-cyan-400">
          <CheckCircle2 className="h-4 w-4" /> Role updated. Refresh to see changes.
        </div>
      ) : null}
    </div>
  );
}
