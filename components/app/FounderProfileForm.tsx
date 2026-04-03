"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Globe, ImagePlus, Loader2, MapPin, Rocket, UploadCloud } from "lucide-react";
import { upsertFounderProfile } from "@/app/actions/profile";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { cn } from "@/lib/utils";

interface Props {
  initial: {
    companyLogoUrl?: string | null;
    companyName?: string | null;
    companyDescription?: string | null;
    roleTitle?: string | null;
    bio?: string | null;
    founderDescription?: string | null;
    educationBackground?: string | null;
    lookingFor?: string[];
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

const sectionTabs = [
  { id: "identity", label: "Profile" },
  { id: "venture", label: "Venture" },
  { id: "founder", label: "Founder" },
  { id: "reach", label: "Reach" },
] as const;

type SectionTab = (typeof sectionTabs)[number]["id"];

export function FounderProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<SectionTab>("identity");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const { data: session } = useSession();
  const defaultName = session?.user?.name ?? "";
  const defaultImage = session?.user?.image ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldRedirect = searchParams.get("onboarding") === "1";
  const username = session?.user?.username ?? "";

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [avatarPreview, logoPreview]);

  const displayAvatar = avatarPreview || defaultImage || undefined;
  const displayLogo = logoPreview || initial?.companyLogoUrl || undefined;
  const displayCompany = initial?.companyName?.trim() || "Your venture";
  const publicProfileHref = username ? `/founder/${username}` : "#";
  const locationLine = [initial?.location, initial?.timezone].filter(Boolean).join(" • ");
  const profileStrengths = useMemo(
    () => [
      { label: "Identity", value: defaultName || initial?.roleTitle ? "Ready" : "Needs work" },
      { label: "Venture", value: initial?.companyName && initial?.companyDescription ? "Ready" : "Needs work" },
      { label: "Reach", value: initial?.linkedin || initial?.website ? "Connected" : "Add links" },
    ],
    [defaultName, initial?.roleTitle, initial?.companyName, initial?.companyDescription, initial?.linkedin, initial?.website],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertFounderProfile(formData);
      if (result.success) {
        setSuccess(true);
        router.refresh();
        if (shouldRedirect) {
          router.push("/app");
        }
      } else {
        setError(result.error);
      }
    });
  };

  function updateAvatarPreview(file: File | null) {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    if (!file) {
      setAvatarPreview(null);
      setAvatarFileName("");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFileName(file.name);
  }

  function updateLogoPreview(file: File | null) {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    if (!file) {
      setLogoPreview(null);
      setLogoFileName("");
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
    setLogoFileName(file.name);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-border/50 bg-card">
        <div className="relative h-40 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.28),transparent_38%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_26%),linear-gradient(135deg,rgba(12,14,18,1),rgba(18,21,26,0.96))]">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(13,15,18,0.3),rgba(13,15,18,0.92))]" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <ProfileAvatar
                  src={displayAvatar}
                  alt={defaultName || "Founder"}
                  fallback={(defaultName || "F").charAt(0)}
                  className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-surface)]"
                  fallbackClassName="rounded-2xl border-4 border-[var(--bg-surface)] bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-2xl text-cyan-200"
                />
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-semibold text-foreground">{defaultName || "Founder profile"}</h2>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                      Founder
                    </span>
                    {initial?.publicVisible !== false ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                        Public profile
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                        Private profile
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {initial?.roleTitle || "Founder"} at {displayCompany}
                    {locationLine ? ` • ${locationLine}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {username ? (
                  <Link
                    href={publicProfileHref}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm text-foreground hover:border-cyan-500/30"
                  >
                    <Globe className="h-4 w-4" />
                    View public profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-sm leading-7 text-muted-foreground">
              Build the profile people actually evaluate: who you are, what you are building, what stage the company is in, and why someone should trust the founder behind it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                displayCompany,
                initial?.projectStage || "Stage not set",
                initial?.chainFocus || "Chain not set",
                initial?.isHiring ? "Hiring active" : "Hiring paused",
              ].map((item) => (
                <span key={item} className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {profileStrengths.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border/50 bg-card p-5">
        <div className="flex flex-wrap gap-2">
          {sectionTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                item.id === tab
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className={tab === "identity" ? "grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" : "hidden"}>
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visual identity</p>

              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <p className="mb-2 text-xs font-medium text-foreground">Avatar</p>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    src={displayAvatar}
                    alt={defaultName || "Founder"}
                    fallback={(defaultName || "F").charAt(0)}
                    className="h-16 w-16 rounded-2xl"
                    fallbackClassName="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-xl text-cyan-200"
                  />
                  <div className="min-w-0 flex-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-cyan-500/40">
                      <ImagePlus className="h-4 w-4 text-cyan-300" />
                      Upload PNG/JPG
                      <input
                        name="avatarFile"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => updateAvatarPreview(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {avatarFileName || "No new avatar selected yet."}
                    </p>
                  </div>
                </div>
                <input
                  name="profilePhoto"
                  type="url"
                  defaultValue={defaultImage}
                  placeholder="Or use external image URL"
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <p className="mb-2 text-xs font-medium text-foreground">Company logo</p>
                <div className="flex items-center gap-3">
                  <CompanyLogo
                    src={displayLogo}
                    alt={displayCompany}
                    fallback={displayCompany}
                    className="h-16 w-16 rounded-2xl border border-border/60 bg-background p-2"
                    fallbackClassName="rounded-2xl border border-border/60 bg-background text-sm text-muted-foreground"
                    imgClassName="p-2"
                  />
                  <div className="min-w-0 flex-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-cyan-500/40">
                      <UploadCloud className="h-4 w-4 text-cyan-300" />
                      Upload logo
                      <input
                        name="companyLogoFile"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => updateLogoPreview(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {logoFileName || "No new company logo selected yet."}
                    </p>
                  </div>
                </div>
                <input
                  name="companyLogoUrl"
                  type="url"
                  defaultValue={initial?.companyLogoUrl ?? ""}
                  placeholder="Or use existing company logo URL"
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Full name</label>
                  <input
                    name="fullName"
                    defaultValue={defaultName}
                    placeholder="Samira Khan"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Role title</label>
                  <input
                    name="roleTitle"
                    type="text"
                    defaultValue={initial?.roleTitle ?? ""}
                    placeholder="Founder, Co-founder, CEO"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Company name</label>
                  <input
                    name="companyName"
                    type="text"
                    defaultValue={initial?.companyName ?? ""}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Country / location</label>
                  <input
                    name="location"
                    type="text"
                    defaultValue={initial?.location ?? ""}
                    placeholder="Bangalore, India"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Timezone</label>
                  <input
                    name="timezone"
                    type="text"
                    defaultValue={initial?.timezone ?? ""}
                    placeholder="Asia/Kolkata"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    name="publicVisible"
                    defaultChecked={initial?.publicVisible ?? true}
                    className="h-4 w-4 rounded border-border bg-background text-cyan-500"
                  />
                  Show my founder profile publicly
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Founder bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={initial?.bio ?? ""}
                  placeholder="A concise founder bio similar to the top section of a LinkedIn profile."
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className={tab === "venture" ? "space-y-4" : "hidden"}>
            <div>
              <label className="mb-1.5 block text-xs font-medium">What are you building?</label>
              <textarea
                name="companyDescription"
                rows={4}
                defaultValue={initial?.companyDescription ?? ""}
                placeholder="Explain the product, the problem, and why it matters now."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Founder narrative</label>
              <textarea
                name="founderDescription"
                rows={4}
                defaultValue={initial?.founderDescription ?? ""}
                placeholder="Why this startup, why you, and what gives you an edge as a founder."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">Startup stage</label>
                <select
                  name="projectStage"
                  defaultValue={initial?.projectStage ?? "IDEA"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  {stages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Chain / ecosystem focus</label>
                <input
                  name="chainFocus"
                  defaultValue={initial?.chainFocus ?? ""}
                  placeholder="Base, Ethereum, Solana"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">Current needs</label>
                <input
                  name="currentNeeds"
                  defaultValue={initial?.currentNeeds?.join(", ") ?? ""}
                  placeholder="Funding, builders, GTM, distribution"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  name="isHiring"
                  defaultChecked={initial?.isHiring ?? false}
                  className="h-4 w-4 rounded border-border bg-background text-cyan-500"
                />
                We are actively hiring
              </label>
            </div>
          </div>

          <div className={tab === "founder" ? "space-y-4" : "hidden"}>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Education / background</label>
              <textarea
                name="educationBackground"
                rows={3}
                defaultValue={initial?.educationBackground ?? ""}
                placeholder="Education, previous companies, technical or domain background."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Looking for</label>
              <input
                name="lookingFor"
                defaultValue={initial?.lookingFor?.join(", ") ?? ""}
                placeholder="Investors, builders, advisors, growth operators"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-foreground">Founder profile guidance</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep this section founder-first, not company-only. People should understand your credibility, operating context, and what kind of support or intros are useful.
              </p>
            </div>
          </div>

          <div className={tab === "reach" ? "space-y-4" : "hidden"}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">Website</label>
                <input
                  name="website"
                  type="url"
                  defaultValue={initial?.website ?? ""}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Pitch deck URL</label>
                <input
                  name="pitchDeckUrl"
                  type="url"
                  defaultValue={initial?.pitchDeckUrl ?? ""}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">LinkedIn</label>
                <input
                  name="linkedin"
                  type="url"
                  defaultValue={initial?.linkedin ?? ""}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Telegram</label>
                <input
                  name="telegram"
                  type="text"
                  defaultValue={initial?.telegram ?? ""}
                  placeholder="@handle"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">X / Twitter</label>
                <input
                  name="twitter"
                  type="text"
                  defaultValue={initial?.twitter ?? ""}
                  placeholder="@handle"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-medium text-foreground">Public reach</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Keep the public founder profile polished enough that a builder or investor can understand who you are before they ever message you.
                </p>
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Founder profile saved and refreshed.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Save updates here, then open the public profile to review how the founder identity is presented.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {username ? (
                <Link
                  href={publicProfileHref}
                  target="_blank"
                  className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  Open public profile
                </Link>
              ) : null}
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? "Saving..." : "Save founder profile"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

