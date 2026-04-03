"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Github, Loader2, Mail, ShieldCheck } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";
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

export default function LoginPage() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/app";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "github" | "google" | "legacy" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

      setMessage("Check your email for a secure sign-in link.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send sign-in link.");
    } finally {
      setLoading(null);
    }
  };

  const handleSupabaseGithub = async () => {
    setLoading("github");
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackBase,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start GitHub sign-in.");
    } finally {
      setLoading(null);
    }
  };

  const handleSupabaseGoogle = async () => {
    setLoading("google");
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackBase,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start Google sign-in.");
    } finally {
      setLoading(null);
    }
  };

  const handleLegacyCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const login = (form.querySelector('[name="login"]') as HTMLInputElement)?.value?.trim();
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
    if (!login || !password) {
      setError("Please enter your email or username and password.");
      return;
    }
    setLoading("legacy");
    const res = await legacySignIn("credentials", {
      login,
      password,
      callbackUrl,
      redirect: "false",
    });
    setLoading(null);
    if ((res as { error?: string } | undefined)?.error) {
      setError("Invalid email/username or password.");
      return;
    }
    window.location.href = callbackUrl;
  };

  const handleLegacyGithub = async () => {
    setLoading("github");
    await legacySignIn("github", { callbackUrl });
  };

  const handleLegacyGoogle = async () => {
    setLoading("google");
    await legacySignIn("google", { callbackUrl });
  };

  const createAccountHref = `/login/create-account?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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
            <div className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
                Contact support
              </Link>
            </div>
          </header>

          <div className="pb-12 md:pb-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
            <section className="max-w-2xl">
              <p className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300 font-medium">
                Secure portal access
              </p>
              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
                Access Webcoin Labs with email, GitHub, or Google.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Authentication is now handled by Supabase Auth, while your roles, onboarding progress, premium state, and profile ownership remain in the Webcoin Labs app database.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Founder, builder, investor, and admin identities stay role-aware",
                  "New users land in onboarding without losing app-level ownership",
                  "Wallets remain a secondary identity layer you can link later",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-full">
              <div className="p-7 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20">
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold text-xl">
                    W
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-center mb-1">Continue to Webcoin Labs</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {isSupabaseAuthEnabled ? "Passwordless email sign-in with GitHub and Google OAuth" : "Legacy auth fallback mode"}
                </p>

                {isSupabaseAuthEnabled ? (
                  <>
                    <form onSubmit={handleSupabaseEmail} className="space-y-4 mb-4">
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className={`${inputClass} pl-9`}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          We&apos;ll email you a secure magic link. No password required.
                        </p>
                      </div>

                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                      {message ? (
                        <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                          <ShieldCheck className="h-4 w-4" />
                          {message}
                        </p>
                      ) : null}

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

                    <p className="mt-4 text-xs text-center text-muted-foreground">
                      First-time sign-ins create or sync your internal Webcoin Labs account safely.
                    </p>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleLegacyCredentials} className="space-y-4 mb-4">
                      <div>
                        <label htmlFor="login" className={labelClass}>
                          Email or username
                        </label>
                        <input id="login" name="login" type="text" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="password" className={labelClass}>
                          Password
                        </label>
                        <input id="password" name="password" type="password" className={inputClass} />
                      </div>
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                      <button
                        type="submit"
                        disabled={loading !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                      >
                        {loading === "legacy" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={handleLegacyGithub}
                      disabled={loading !== null}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {loading === "github" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                      Continue with GitHub
                    </button>

                    <button
                      type="button"
                      onClick={handleLegacyGoogle}
                      disabled={loading !== null}
                      className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {loading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleMark />}
                      Continue with Google
                    </button>
                  </>
                )}

                <p className="mt-5 text-center text-xs text-muted-foreground">
                  New here?{" "}
                  <Link href={createAccountHref} className="text-blue-400 hover:text-blue-300 transition-colors underline">
                    Start with email
                  </Link>
                </p>

                <p className="text-xs text-muted-foreground text-center mt-7 leading-relaxed">
                  By signing in, you agree to our{" "}
                  <a href="/terms" className="underline hover:text-foreground transition-colors">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
                </p>
              </div>
            </section>
          </div>
          <p className="text-center pb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Back to webcoinlabs.com</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
