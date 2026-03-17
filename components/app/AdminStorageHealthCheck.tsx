"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { runStorageHealthCheck, type StorageHealthCheckResult } from "@/app/actions/storage";

export function AdminStorageHealthCheck() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<StorageHealthCheckResult | null>(null);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h2 className="text-lg font-semibold">Storage Health Check</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Runs upload → read → delete against the active provider.
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const check = await runStorageHealthCheck();
            setResult(check);
          });
        }}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Running check..." : "Run Storage Health Check"}
      </button>

      {result ? (
        <div className="mt-4 rounded-lg border border-border/60 bg-background p-4 text-sm">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className={result.success ? "text-emerald-300" : "text-destructive"}>
              {result.success ? "Storage check passed" : "Storage check failed"}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">Provider: {result.provider}</p>
          {result.success ? (
            <>
              <p className="text-muted-foreground mt-1">Stored bytes: {result.bytesStored}</p>
              <p className="text-muted-foreground mt-1">Read bytes: {result.bytesRead}</p>
              <p className="text-muted-foreground mt-1">Temporary key: {result.storageKey}</p>
            </>
          ) : (
            <p className="text-muted-foreground mt-1">Error: {result.error}</p>
          )}
          <p className="text-muted-foreground mt-1">Checked at: {new Date(result.checkedAt).toLocaleString()}</p>
        </div>
      ) : null}
    </div>
  );
}
