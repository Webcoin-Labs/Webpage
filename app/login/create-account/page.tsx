"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, User, Lock, ArrowLeft } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";
import { register, type AuthResult } from "@/app/actions/auth";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground";

export default function CreateAccountPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim();
    const username = (form.querySelector('[name="username"]') as HTMLInputElement)?.value?.trim();
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
    const confirmPassword = (form.querySelector('[name="confirmPassword"]') as HTMLInputElement)?.value;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value?.trim();

    if (!email || !username || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result: AuthResult = await register({
        email,
        username: username.toLowerCase(),
        password,
        name: name || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Account created! Signing you in...");
      const signInRes = await signIn("credentials", {
        login: email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (signInRes?.url) {
        window.location.href = signInRes.url;
      } else {
        setMessage("Account created. Please sign in with your email and password.");
      }
    });
  };

  const signInHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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

          <h1 className="text-xl font-bold text-center mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Claim a unique username and sign in with email or username anytime
          </p>

          <form onSubmit={handleSignUp} className="space-y-4 mb-4">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass + " pl-9"}
                />
              </div>
            </div>
            <div>
              <label htmlFor="username" className={labelClass}>
                Username <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="username"
                  placeholder="johndoe (letters, numbers, _ -)"
                  className={inputClass + " pl-9"}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You can sign in later with this username or your email.
              </p>
            </div>
            <div>
              <label htmlFor="name" className={labelClass}>
                Display name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Optional"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className={labelClass}>
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min 8 chars, upper, lower, number"
                  className={inputClass + " pl-9"}
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputClass + " pl-9"}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-cyan-400">{message}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <Link
            href={signInHref}
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
