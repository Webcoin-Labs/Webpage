"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HeroBackground } from "@/components/common/HeroBackground";
import { requestPasswordReset } from "@/app/actions/auth";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDevResetLink(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    startTransition(async () => {
      const result = await requestPasswordReset(email.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSent(true);
      if (result.devResetLink) setDevResetLink(result.devResetLink);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="p-8 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold text-xl">
              W
            </div>
          </div>

          {sent ? (
            <>
              <h1 className="text-xl font-bold text-center mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                If an account exists for <strong className="text-foreground">{email}</strong>, we&apos;ve sent a link to reset your password.
              </p>
              {devResetLink && (
                <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Development: use this link to reset</p>
                  <a
                    href={devResetLink}
                    className="text-xs text-cyan-400 break-all hover:underline"
                  >
                    {devResetLink}
                  </a>
                </div>
              )}
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-center mb-2">Forgot password?</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Enter the email you use to sign in and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass + " pl-9"}
                      autoComplete="email"
                      disabled={isPending}
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to webcoinlabs.com</Link>
        </p>
      </div>
    </div>
  );
}
