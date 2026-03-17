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
  } | null;
}

const stages = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "LIVE", label: "Live" },
];

export function FounderProfileForm({ initial }: Props) {
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
      <p className="mb-6 text-sm text-muted-foreground">
        Define your startup identity layer so builders and partners can discover your company context.
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
              placeholder="Samira Khan"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
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
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              name="companyName"
              type="text"
              required
              defaultValue={initial?.companyName ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Founder Position / Title</label>
            <input
              name="roleTitle"
              type="text"
              defaultValue={initial?.roleTitle ?? ""}
              placeholder="CEO, CTO, Founder"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Startup Stage <span className="text-destructive">*</span>
            </label>
            <select
              name="projectStage"
              required
              defaultValue={initial?.projectStage ?? "IDEA"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            >
              {stages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
            <label className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                name="isHiring"
                defaultChecked={initial?.isHiring ?? false}
                className="h-4 w-4 rounded border-border bg-background text-green-500 focus:ring-green-500/40"
              />
              Are you hiring?
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Short Company Description <span className="text-destructive">*</span>
          </label>
          <textarea
            name="companyDescription"
            rows={3}
            required
            defaultValue={initial?.companyDescription ?? ""}
            placeholder="What are you building and why now?"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Founder Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={initial?.bio ?? ""}
            placeholder="Your background, past wins, and focus."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Location</label>
            <input
              name="location"
              type="text"
              defaultValue={initial?.location ?? ""}
              placeholder="City, Country"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Timezone</label>
            <input
              name="timezone"
              type="text"
              defaultValue={initial?.timezone ?? ""}
              placeholder="UTC+1"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Chain / Ecosystem Focus <span className="text-destructive">*</span>
            </label>
            <input
              name="chainFocus"
              required
              defaultValue={initial?.chainFocus ?? ""}
              placeholder="Base, Ethereum, Solana"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Current Needs <span className="text-destructive">*</span>
            </label>
            <input
              name="currentNeeds"
              required
              defaultValue={initial?.currentNeeds?.join(", ") ?? ""}
              placeholder="Funding, builders, growth, launch"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={initial?.website ?? ""}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">LinkedIn</label>
            <input
              name="linkedin"
              type="url"
              defaultValue={initial?.linkedin ?? ""}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Pitch Deck URL</label>
            <input
              name="pitchDeckUrl"
              type="url"
              defaultValue={initial?.pitchDeckUrl ?? ""}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Telegram</label>
            <input
              name="telegram"
              type="text"
              defaultValue={initial?.telegram ?? ""}
              placeholder="@handle"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">Twitter / X</label>
          <input
            name="twitter"
            type="text"
            defaultValue={initial?.twitter ?? ""}
            placeholder="@handle"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Profile saved.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500/90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
