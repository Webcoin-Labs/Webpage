"use client";

import { useState, useTransition } from "react";
import { upsertBuilderProfile } from "@/app/actions/profile";
import { Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  initial: {
    handle?: string | null;
    title?: string | null;
    headline?: string | null;
    affiliation?: string | null;
    independent?: boolean;
    openToWork?: boolean;
    bio?: string | null;
    skills?: string[];
    preferredChains?: string[];
    openTo?: string[];
    location?: string | null;
    timezone?: string | null;
    experience?: string | null;
    github?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    website?: string | null;
    portfolioUrl?: string | null;
    interests?: string[];
    achievements?: string | null;
    openSourceContributions?: string | null;
    resumeUrl?: string | null;
  } | null;
}

const openToOptions = ["Freelance", "Full-time", "Co-founder", "Contributor"];
const steps = ["Identity", "Skills & Work", "Links & Portfolio"];

export function BuilderProfileForm({ initial }: Props) {
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
      const result = await upsertBuilderProfile(formData);
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
      <h2 className="mb-2 font-semibold">Builder Profile</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Complete this guided profile to unlock founder matches and opportunities.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              index === step ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-border/60 text-muted-foreground"
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
                placeholder="Alex Rivera"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Profile Image</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-blue-500/40">
                <ImagePlus className="h-4 w-4 text-blue-300" />
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
              <label className="mb-1.5 block text-xs font-medium">Handle</label>
              <input
                name="handle"
                defaultValue={initial?.handle ?? ""}
                placeholder="jane-builder"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Title</label>
              <input
                name="title"
                defaultValue={initial?.title ?? ""}
                placeholder="Smart Contract Engineer"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Affiliation / Company</label>
              <input
                name="affiliation"
                defaultValue={initial?.affiliation ?? ""}
                placeholder="Independent, studio, org"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Headline</label>
              <input
                name="headline"
                defaultValue={initial?.headline ?? ""}
                placeholder="I build secure on-chain systems."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                name="openToWork"
                defaultChecked={initial?.openToWork ?? true}
                className="h-4 w-4 rounded border-border bg-background text-blue-500"
              />
              Open to projects
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                name="independent"
                defaultChecked={initial?.independent ?? false}
                className="h-4 w-4 rounded border-border bg-background text-blue-500"
              />
              Independent builder
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Bio</label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={initial?.bio ?? ""}
              placeholder="Tell founders what you've built and what you love working on."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Achievements</label>
            <textarea
              name="achievements"
              rows={2}
              defaultValue={initial?.achievements ?? ""}
              placeholder="Hackathon wins, shipped products, growth milestones"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Open Source Contributions</label>
            <textarea
              name="openSourceContributions"
              rows={2}
              defaultValue={initial?.openSourceContributions ?? ""}
              placeholder="Repos, PRs, protocols, libraries, grants"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Skills</label>
              <input
                name="skills"
                type="text"
                defaultValue={initial?.skills?.join(", ") ?? ""}
                placeholder="Rust, Solidity, TypeScript..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Preferred Chains</label>
              <input
                name="preferredChains"
                type="text"
                defaultValue={initial?.preferredChains?.join(", ") ?? ""}
                placeholder="Base, Ethereum, Solana"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Open To</label>
            <div className="flex flex-wrap gap-3">
              {openToOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="openTo"
                    value={option}
                    defaultChecked={initial?.openTo?.includes(option) ?? false}
                    className="h-4 w-4 rounded border-border bg-background text-blue-500"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Experience</label>
              <input
                name="experience"
                type="text"
                defaultValue={initial?.experience ?? ""}
                placeholder="Years / specialization"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
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
                placeholder="UTC+2"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">GitHub URL</label>
              <input
                name="github"
                type="url"
                defaultValue={initial?.github ?? ""}
                placeholder="https://github.com/..."
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
              <label className="mb-1.5 block text-xs font-medium">Twitter / X</label>
              <input
                name="twitter"
                type="text"
                defaultValue={initial?.twitter ?? ""}
                placeholder="@handle"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
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
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Portfolio URL</label>
            <input
              name="portfolioUrl"
              type="url"
              defaultValue={initial?.portfolioUrl ?? ""}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Resume URL</label>
            <input
              name="resumeUrl"
              type="url"
              defaultValue={initial?.resumeUrl ?? ""}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">Interests (comma-separated)</label>
            <input
              name="interests"
              type="text"
              defaultValue={initial?.interests?.join(", ") ?? ""}
              placeholder="DeFi, infra, stablecoins"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <div className="flex items-center gap-2 text-sm text-blue-400">
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
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500/90 disabled:opacity-60"
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
