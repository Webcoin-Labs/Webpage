"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HeroBackground } from "@/components/common/HeroBackground";
import { resetPassword } from "@/app/actions/auth";
import { Loader2, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token || !email) {
      setError("Invalid reset link. Please request a new one from the forgot password page.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      const result = await resetPassword({ token, email, password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <div className="p-8 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl text-center">
            <h1 className="text-xl font-bold mb-2">Invalid reset link</h1>
            <p className="text-sm text-muted-foreground mb-6">
              This link is missing required parameters. Please use the link from your email or request a new one.
            </p>
            <Link
              href="/login/forgot-password"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <div className="p-8 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Password updated</h1>
            <p className="text-sm text-muted-foreground mb-6">
              You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-center mb-2">Set new password</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className={labelClass}>
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, lower, number"
                  className={inputClass + " pl-9 pr-10"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + " pl-9 pr-10"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 rounded-md"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                "Reset password"
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
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to webcoinlabs.com</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
