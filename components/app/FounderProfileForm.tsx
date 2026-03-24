"use client";

import { useState, useTransition } from "react";
import { upsertFounderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  initial: {
    companyLogoUrl?: string | null;
    companyName?: string | null;
    companyDescription?: string | null;
    roleTitle?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone?: string | null;
    projectStage?: "IDEA" | "MVP" | "LIVE" | null;
    chainFocus?: string | null;
    currentNeeds?: string[];
    website?: string | null;
    pitchDeckUrl?: string | null;
    linkedin?: string | null;
    telegram?: string | null;
    twitter?: string | null;
    isHiring?: boolean;
    publicVisible?: boolean;
  } | null;
}

const stages = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "LIVE", label: "Live" },
];
const steps = ["Identity", "Company", "Startup Context", "Socials"];

export function FounderProfileForm({ initial }: Props) {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertFounderProfile(formData);
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
      <h2 className="mb-2 font-semibold">Founder Profile</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Complete this step-by-step profile to unlock founder tools and public startup visibility.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              index === step ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-border/60 text-muted-foreground"
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
              <label className="mb-1.5 block text-xs font-medium">Full Name</label>
              <input
                name="fullName"
                defaultValue={defaultName}
                placeholder="Samira Khan"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Profile Image</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-green-500/40">
                <ImagePlus className="h-4 w-4 text-green-300" />
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Company Name</label>
              <input
                name="companyName"
                type="text"
                defaultValue={initial?.companyName ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Designation</label>
              <input
                name="roleTitle"
                type="text"
                defaultValue={initial?.roleTitle ?? ""}
                placeholder="Founder, Co-founder, CEO, CTO"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Company Logo</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-green-500/40">
              <ImagePlus className="h-4 w-4 text-green-300" />
              Upload PNG/JPG (auto-optimized)
              <input name="companyLogoFile" type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" />
            </label>
            <input
              name="companyLogoUrl"
              type="url"
              defaultValue={initial?.companyLogoUrl ?? ""}
              placeholder="Or use existing company logo URL"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Short Company Description</label>
            <textarea
              name="companyDescription"
              rows={3}
              defaultValue={initial?.companyDescription ?? ""}
              placeholder="What are you building and why now?"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Founder Bio</label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={initial?.bio ?? ""}
              placeholder="Your background, past wins, and focus."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Startup Stage</label>
              <select
                name="projectStage"
                defaultValue={initial?.projectStage ?? "IDEA"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                {stages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Chain / Ecosystem Focus</label>
              <input
                name="chainFocus"
                defaultValue={initial?.chainFocus ?? ""}
                placeholder="Base, Ethereum, Solana"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Current Needs</label>
              <input
                name="currentNeeds"
                defaultValue={initial?.currentNeeds?.join(", ") ?? ""}
                placeholder="Funding, builders, growth, launch"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Pitch Deck URL</label>
              <input
                name="pitchDeckUrl"
                type="url"
                defaultValue={initial?.pitchDeckUrl ?? ""}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Location</label>
              <input
                name="location"
                type="text"
                defaultValue={initial?.location ?? ""}
                placeholder="City, Country"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Timezone</label>
              <input
                name="timezone"
                type="text"
                defaultValue={initial?.timezone ?? ""}
                placeholder="UTC+1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="isHiring"
              defaultChecked={initial?.isHiring ?? false}
              className="h-4 w-4 rounded border-border bg-background text-green-500"
            />
            Are you hiring?
          </label>
        </div>

        <div className={step === 3 ? "space-y-5" : "hidden"}>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Telegram</label>
              <input
                name="telegram"
                type="text"
                defaultValue={initial?.telegram ?? ""}
                placeholder="@handle"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Twitter / X</label>
              <input
                name="twitter"
                type="text"
                defaultValue={initial?.twitter ?? ""}
                placeholder="@handle"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="publicVisible"
              defaultChecked={initial?.publicVisible ?? true}
              className="h-4 w-4 rounded border-border bg-background text-green-500"
            />
            Show my founder profile and startups in the public founder network
          </label>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
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
              className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500/90 disabled:opacity-60"
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
