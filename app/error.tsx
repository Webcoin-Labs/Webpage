"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error-boundary]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-sm font-medium border border-cyan-500/30"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm font-medium"
          >
            Home
          </Link>
        </div>
        {/* Intentionally do not render stack traces in UI. */}
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 text-xs text-muted-foreground break-words">
            {error.message}
            {error.digest ? ` | digest: ${error.digest}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

