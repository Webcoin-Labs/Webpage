"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, User, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { HeroBackground } from "@/components/common/HeroBackground";
import { register, type AuthResult } from "@/app/actions/auth";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background/90 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";
const labelClass = "block text-xs font-medium mb-1.5 text-foreground/90";

export default function CreateAccountPage() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/app";

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      if (signInRes?.error) {
        setMessage("Account created. Please sign in with your email and password.");
        return;
      }
      if (signInRes?.ok) {
        window.location.href = callbackUrl;
      } else {
        setMessage("Account created. Please sign in with your email and password.");
      }
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
                Create your Webcoin Labs account.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Claim a unique username, manage your founder profile, and keep everything in one place.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Sign in with email or username anytime",
                  "Manage applications and intros",
                  "Get ecosystem updates in one dashboard",
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

                <h2 className="text-2xl font-semibold text-center mb-1">Create account</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Use email/username and password
                </p>

                <form onSubmit={handleSignUp} className="space-y-4 mb-4">
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
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClass + " pl-9"}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username
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
                    <p className="mt-1.5 text-xs text-muted-foreground">
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
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Min 8 chars, upper, lower, number"
                        className={inputClass + " pl-9 pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-md"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="********"
                        className={inputClass + " pl-9 pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-pressed={showConfirmPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-md"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {message && <p className="text-sm text-emerald-400">{message}</p>}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                  </button>
                </form>

                <Link
                  href={signInHref}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
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

