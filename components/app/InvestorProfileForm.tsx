"use client";

import { useState, useTransition } from "react";
import { upsertInvestorProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  initial: {
    firmName?: string | null;
    roleTitle?: string | null;
    focus?: string | null;
    location?: string | null;
    website?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    ticketSize?: string | null;
    lookingFor?: string | null;
    investmentThesis?: string | null;
  } | null;
}

const steps = ["Identity", "Firm", "Links"];

export function InvestorProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const { data: session } = useSession();
  const defaultName = session?.user?.name ?? "";
  const defaultImage = session?.user?.image ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldRedirect = searchParams.get("onboarding") === "1";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await upsertInvestorProfile(formData);
      if (result.success) {
        setSuccess(true);
        if (shouldRedirect) {
          router.push("/app");
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <h2 className="mb-2 font-semibold">Investor Profile</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Complete this guided profile to unlock investor discovery and Kreatorboard signals.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              index === step ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-border/60 text-muted-foreground"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={step === 0 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                name="fullName"
                required
                defaultValue={defaultName}
                placeholder="Alex Morgan"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Profile Image</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-amber-500/40">
                <ImagePlus className="h-4 w-4 text-amber-300" />
                Upload PNG/JPG (max 5MB)
                <input name="avatarFile" type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" />
              </label>
              <input
                name="profilePhoto"
                type="url"
                defaultValue={defaultImage}
                placeholder="Or use external image URL"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Firm Name <span className="text-destructive">*</span>
              </label>
              <input
                name="firmName"
                required
                defaultValue={initial?.firmName ?? ""}
                placeholder="Your fund or firm"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Role Title</label>
              <input
                name="roleTitle"
                defaultValue={initial?.roleTitle ?? ""}
                placeholder="Partner, Principal, Analyst"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Investment Focus</label>
            <input
              name="focus"
              defaultValue={initial?.focus ?? ""}
              placeholder="Infrastructure, stablecoins, DeFi, creator economy"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Ticket Size</label>
              <input
                name="ticketSize"
                defaultValue={initial?.ticketSize ?? ""}
                placeholder="$25k-$100k"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">What You Are Looking For</label>
              <input
                name="lookingFor"
                defaultValue={initial?.lookingFor ?? ""}
                placeholder="Early traction, strong teams, infra bets"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Location</label>
            <input
              name="location"
              defaultValue={initial?.location ?? ""}
              placeholder="City, Country"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Investment Thesis</label>
            <textarea
              name="investmentThesis"
              rows={3}
              defaultValue={initial?.investmentThesis ?? ""}
              placeholder="Your core conviction, sectors, and signals."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Website</label>
              <input
                name="website"
                type="url"
                defaultValue={initial?.website ?? ""}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">LinkedIn</label>
              <input
                name="linkedin"
                type="url"
                defaultValue={initial?.linkedin ?? ""}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Twitter / X</label>
            <input
              name="twitter"
              defaultValue={initial?.twitter ?? ""}
              placeholder="@handle"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <CheckCircle2 className="h-4 w-4" /> Profile saved.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0 || isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-50"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-500/90 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Saving..." : "Save Profile"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
