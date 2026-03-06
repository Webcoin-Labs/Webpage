"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-border/50 bg-white text-black p-6 text-center">
            <h1 className="text-xl font-bold mb-2">Application error</h1>
            <p className="text-sm mb-6">
              Please refresh or try again later.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg border border-black/10 bg-black text-white text-sm font-medium"
              >
                Retry
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium"
              >
                Home
              </Link>
            </div>
            {process.env.NODE_ENV !== "production" && (
              <p className="mt-6 text-xs break-words opacity-70">{error.message}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

