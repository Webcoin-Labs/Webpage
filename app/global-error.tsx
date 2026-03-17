"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error-boundary]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card p-6 text-center">
            <h1 className="text-xl font-bold mb-2">Application error</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Please refresh or try again later.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-sm font-medium border border-cyan-500/30"
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
            {process.env.NODE_ENV !== "production" && (
              <p className="mt-6 text-xs break-words text-muted-foreground">
                {error.message}
                {error.digest ? ` | digest: ${error.digest}` : ""}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

