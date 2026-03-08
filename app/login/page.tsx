"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Github, Loader2, Mail, Lock } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background/90 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground/90";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";

  const [loading, setLoading] = useState<"google" | "github" | "credentials" | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    setError("");
    await signIn(provider, { callbackUrl });
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const login = (form.querySelector('[name="login"]') as HTMLInputElement)?.value?.trim();
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
    if (!login || !password) {
      setError("Please enter your email or username and password.");
      return;
    }
    setLoading("credentials");
    const res = await signIn("credentials", {
      login,
      password,
      callbackUrl,
      redirect: false,
    });
    setLoading(null);
    if (res?.error) {
      setError("Invalid email/username or password.");
      return;
    }
    if (res?.url) window.location.href = res.url;
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
                Schedule faster decisions with the Webcoin Labs network.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Sign in to manage your founder profile, builder collaborations, intros, and product applications in one place.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Founder and builder identity",
                  "Application and intro workflow",
                  "Ecosystem connections and updates",
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

                <h2 className="text-2xl font-semibold text-center mb-1">Sign in</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Use email/username and password
                </p>

                <form onSubmit={handleSignIn} className="space-y-4 mb-4">
                  <div>
                    <label htmlFor="login" className={labelClass}>
                      Email or username
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="login"
                        name="login"
                        type="text"
                        autoComplete="username email"
                        placeholder="you@example.com or your_username"
                        className={inputClass + " pl-9"}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="signin-password" className={labelClass}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="signin-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={inputClass + " pl-9"}
                      />
                    </div>
                    <p className="mt-1.5 text-right">
                      <Link
                        href="/login/forgot-password"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Are you new?{" "}
                      <Link href={createAccountHref} className="text-blue-400 hover:text-blue-300 transition-colors underline">
                        Create an account to get started
                      </Link>
                    </p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                  >
                    {loading === "credentials" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs text-muted-foreground">
                    <span className="bg-card px-2">or continue with</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    {loading === "google" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    {loading === "github" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Github className="w-5 h-5" />
                    )}
                    Continue with GitHub
                  </button>
                </div>

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
            <Link href="/" className="hover:text-foreground transition-colors">← Back to webcoinlabs.com</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
