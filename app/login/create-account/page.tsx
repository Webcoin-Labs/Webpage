"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Github, Loader2, Mail } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";
import { register, type AuthResult } from "@/app/actions/auth";
import { authConfig, isSupabaseAuthEnabled } from "@/lib/auth-config";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background/90 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground/90";

function GoogleMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M21.8 12.23c0-.78-.07-1.53-.2-2.23H12v4.23h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.64Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.92 6.77-2.48l-3.3-2.56c-.92.62-2.09.99-3.47.99-2.66 0-4.92-1.8-5.72-4.22H2.87v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.73a5.98 5.98 0 0 1 0-3.46V7.63H2.87a10 10 0 0 0 0 8.74l3.41-2.64Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.07 3.03 14.75 2 12 2a10 10 0 0 0-9.13 5.63l3.41 2.64c.8-2.42 3.06-4.22 5.72-4.22Z"
        fill="#EA4335"
      />
    </svg>
  );
}

async function legacySignIn(provider: "credentials" | "github" | "google", params: Record<string, string>) {
  const nextAuth = await import("next-auth/react");
  return nextAuth.signIn(provider, params);
}

export default function CreateAccountPage() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/app";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"email" | "github" | "google" | null>(null);
  const [isPending, startTransition] = useTransition();

  const callbackBase = `${typeof window !== "undefined" ? window.location.origin : authConfig.appUrl}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;

  const handleSupabaseEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }

    setLoading("email");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: callbackBase,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage("Check your inbox to verify your email and start onboarding.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send sign-in link.");
    } finally {
      setLoading(null);
    }
  };

  const handleSupabaseGithub = async () => {
    setError("");
    setMessage("");
    setLoading("github");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callbackBase },
      });
      if (oauthError) setError(oauthError.message);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start GitHub sign-in.");
    } finally {
      setLoading(null);
    }
  };

  const handleSupabaseGoogle = async () => {
    setError("");
    setMessage("");
    setLoading("google");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackBase },
      });
      if (oauthError) setError(oauthError.message);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start Google sign-in.");
    } finally {
      setLoading(null);
    }
  };

  const handleLegacyGithub = async () => {
    setError("");
    setMessage("");
    setLoading("github");
    await legacySignIn("github", { callbackUrl });
  };

  const handleLegacyGoogle = async () => {
    setError("");
    setMessage("");
    setLoading("google");
    await legacySignIn("google", { callbackUrl });
  };

  const handleLegacyCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const emailValue = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim();
    const username = (form.querySelector('[name="username"]') as HTMLInputElement)?.value?.trim();
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
    const confirmPassword = (form.querySelector('[name="confirmPassword"]') as HTMLInputElement)?.value;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value?.trim();

    if (!emailValue || !username || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result: AuthResult = await register({
        email: emailValue,
        username: username.toLowerCase(),
        password,
        name: name || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Account created! Signing you in...");
      const signInRes = await legacySignIn("credentials", {
        login: emailValue,
        password,
        callbackUrl,
        redirect: "false",
      });
      if ((signInRes as { error?: string } | undefined)?.error) {
        setMessage("Account created. Please sign in with your email and password.");
        return;
      }
      window.location.href = callbackUrl;
    });
  };

  const signInHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_15%_20%,rgba(59,130,246,0.16),transparent_70%)]" />

      <div className="relative z-10 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="pt-8 pb-6 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-foreground">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                W
              </span>
              <span className="font-semibold tracking-tight">Webcoin Labs</span>
            </Link>
          </header>

          <div className="pb-12 md:pb-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
            <section className="max-w-2xl">
              <p className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300 font-medium">
                New account
              </p>
              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
                Create your Webcoin Labs identity.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                {isSupabaseAuthEnabled
                  ? "Authenticate with email magic link or GitHub, then complete role-specific onboarding inside the app."
                  : "Legacy account creation remains available until Supabase Auth is fully configured in every environment."}
              </p>
            </section>

            <section className="w-full">
              <div className="p-7 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20">
                <h2 className="text-2xl font-semibold text-center mb-1">Start your account</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {isSupabaseAuthEnabled ? "Use email, GitHub, or Google" : "Legacy sign-up fallback"}
                </p>

                {isSupabaseAuthEnabled ? (
                  <>
                    <form onSubmit={handleSupabaseEmail} className="space-y-4">
                      <div>
                        <label htmlFor="email" className={labelClass}>Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className={`${inputClass} pl-9`}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Username, role, and profile details are collected safely in onboarding after verification.
                        </p>
                      </div>
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                      <button
                        type="submit"
                        disabled={loading !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                      >
                        {loading === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Continue with Email
                      </button>
                    </form>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs text-muted-foreground">
                        <span className="bg-card px-2">or</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSupabaseGithub}
                      disabled={loading !== null}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {loading === "github" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                      Continue with GitHub
                    </button>

                    <button
                      type="button"
                      onClick={handleSupabaseGoogle}
                      disabled={loading !== null}
                      className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {loading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleMark />}
                      Continue with Google
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      <button
                        type="button"
                        onClick={handleLegacyGithub}
                        disabled={loading !== null || isPending}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        {loading === "github" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                        Continue with GitHub
                      </button>

                      <button
                        type="button"
                        onClick={handleLegacyGoogle}
                        disabled={loading !== null || isPending}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        {loading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleMark />}
                        Continue with Google
                      </button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs text-muted-foreground">
                        <span className="bg-card px-2">or create with email</span>
                      </div>
                    </div>

                    <form onSubmit={handleLegacyCreate} className="space-y-4">
                      <div>
                        <label htmlFor="legacy-email" className={labelClass}>Email</label>
                        <input id="legacy-email" name="email" type="email" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="legacy-username" className={labelClass}>Username</label>
                        <input id="legacy-username" name="username" type="text" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="legacy-name" className={labelClass}>Display name</label>
                        <input id="legacy-name" name="name" type="text" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="legacy-password" className={labelClass}>Password</label>
                        <input id="legacy-password" name="password" type="password" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="legacy-confirm" className={labelClass}>Confirm password</label>
                        <input id="legacy-confirm" name="confirmPassword" type="password" className={inputClass} />
                      </div>
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                      <button
                        type="submit"
                        disabled={isPending || loading !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                      </button>
                    </form>
                  </>
                )}

                <Link
                  href={signInHref}
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
