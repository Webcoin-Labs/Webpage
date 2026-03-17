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
  } | null;
}

const openToOptions = ["Freelance", "Full-time", "Co-founder", "Contributor"];

export function BuilderProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
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
      <p className="mb-6 text-sm text-muted-foreground">
        Build a strong identity so founders can discover and trust your profile faster.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              name="fullName"
              required
              defaultValue={defaultName}
              placeholder="Alex Rivera"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Handle <span className="text-muted-foreground">(for /builders/your-handle)</span>
            </label>
            <input
              name="handle"
              defaultValue={initial?.handle ?? ""}
              placeholder="jane-builder"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder="Smart Contract Engineer"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Affiliation / Company</label>
            <input
              name="affiliation"
              defaultValue={initial?.affiliation ?? ""}
              placeholder="ArcPay, Independent studio, etc."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Headline</label>
            <input
              name="headline"
              defaultValue={initial?.headline ?? ""}
              placeholder="I build secure on-chain systems."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="openToWork"
              defaultChecked={initial?.openToWork ?? true}
              className="h-4 w-4 rounded border-border bg-background text-blue-500 focus:ring-blue-500/40"
            />
            Open to projects
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="independent"
              defaultChecked={initial?.independent ?? false}
              className="h-4 w-4 rounded border-border bg-background text-blue-500 focus:ring-blue-500/40"
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
            placeholder="Tell founders what you’ve built and what you love working on."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Skills <span className="text-destructive">*</span>
            </label>
            <input
              name="skills"
              type="text"
              required
              defaultValue={initial?.skills?.join(", ") ?? ""}
              placeholder="Rust, Solidity, TypeScript..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Preferred Chains <span className="text-destructive">*</span>
            </label>
            <input
              name="preferredChains"
              type="text"
              required
              defaultValue={initial?.preferredChains?.join(", ") ?? ""}
              placeholder="Base, Ethereum, Solana"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Open To <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {openToOptions.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="openTo"
                  value={option}
                  defaultChecked={initial?.openTo?.includes(option) ?? false}
                  className="h-4 w-4 rounded border-border bg-background text-blue-500 focus:ring-blue-500/40"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Experience</label>
            <input
              name="experience"
              type="text"
              defaultValue={initial?.experience ?? ""}
              placeholder="5+ years in protocol engineering"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Location</label>
            <input
              name="location"
              type="text"
              defaultValue={initial?.location ?? ""}
              placeholder="City, Country"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Timezone</label>
          <input
            name="timezone"
            type="text"
            defaultValue={initial?.timezone ?? ""}
            placeholder="UTC+2"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">GitHub URL</label>
            <input
              name="github"
              type="url"
              defaultValue={initial?.github ?? ""}
              placeholder="https://github.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">LinkedIn</label>
            <input
              name="linkedin"
              type="url"
              defaultValue={initial?.linkedin ?? ""}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={initial?.website ?? ""}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Interests (comma-separated)</label>
          <input
            name="interests"
            type="text"
            defaultValue={initial?.interests?.join(", ") ?? ""}
            placeholder="DeFi, infra, stablecoins"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <CheckCircle2 className="h-4 w-4" /> Profile saved.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500/90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
