import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/server/db/client";
import { BuilderProfileForm } from "@/components/app/BuilderProfileForm";
import { FounderProfileForm } from "@/components/app/FounderProfileForm";
import { InvestorProfileForm } from "@/components/app/InvestorProfileForm";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { linkFounderBuilderIdentity, setContactVisibility } from "@/app/actions/founder-os-expansion";
import { createFeedPost, deleteProfileContactMethod, updateNetworkingSettings, upsertProfileContactMethod } from "@/app/actions/ecosystem";
import { getProfileViewInsights } from "@/lib/profile-views";
import { Globe, Linkedin, Twitter, Github, MessageCircle, Mail, MapPin, Pencil, Eye, ExternalLink, Link2, Plus, Send, AlertTriangle } from "lucide-react";

export const metadata = { title: "Profile - Webcoin Labs" };

export default async function ProfilePage() {
  const session = await getServerSession();
  const user = session!.user;

  const [builderProfile, founderProfile, investorProfile, contactMethods, recentPosts, viewInsights] = await Promise.all([
    db.builderProfile.findUnique({ where: { userId: user.id } }),
    db.founderProfile.findUnique({ where: { userId: user.id } }),
    db.investorProfile.findUnique({ where: { userId: user.id } }),
    db.profileContactMethod.findMany({ where: { userId: user.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.feedPost.findMany({
      where: { authorUserId: user.id, visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getProfileViewInsights(user.id, 10),
  ]);
  const publicSettings = await db.publicProfileSettings.findUnique({ where: { userId: user.id } });
  const roleVisibility =
    user.role === "FOUNDER"
      ? founderProfile?.publicVisible ?? true
      : user.role === "INVESTOR"
        ? investorProfile?.isPublic ?? true
        : builderProfile?.publicVisible ?? true;

  const builderAffiliation = getBuilderAffiliation(builderProfile);
  const founderAffiliation = getFounderAffiliation(founderProfile);
  const investorAffiliation = investorProfile?.firmName?.trim()
    ? { label: investorProfile.firmName.trim(), variant: "default" as const }
    : null;
  const founderCompanyName = founderProfile?.companyName?.trim();
  const founderHasValidCompany = Boolean(founderCompanyName && founderCompanyName.toLowerCase() !== "check");

  const roleLabel =
    user.role === "FOUNDER" ? "Founder"
      : user.role === "BUILDER" ? "Builder"
        : user.role === "INVESTOR" ? "Investor"
          : "Member";

  const publicProfileHref =
    user.role === "FOUNDER" && user.username
      ? `/founder/${user.username}`
      : user.role === "BUILDER" && user.username
        ? `/builder/${user.username}`
        : user.role === "INVESTOR" && user.username
          ? `/investor/${user.username}`
          : null;

  // Collect social links
  const socialLinks: { icon: typeof Globe; href: string; label: string; color: string }[] = [];
  if (user.role === "FOUNDER") {
    if (founderProfile?.linkedin) socialLinks.push({ icon: Linkedin, href: founderProfile.linkedin, label: "LinkedIn", color: "#0a66c2" });
    if (founderProfile?.twitter) socialLinks.push({ icon: Twitter, href: founderProfile.twitter, label: "X", color: "#e4e4e7" });
    if (founderProfile?.website) socialLinks.push({ icon: Globe, href: founderProfile.website, label: "Website", color: "#34d399" });
  }
  if (user.role === "BUILDER") {
    if (builderProfile?.linkedin) socialLinks.push({ icon: Linkedin, href: builderProfile.linkedin, label: "LinkedIn", color: "#0a66c2" });
    if (builderProfile?.github) socialLinks.push({ icon: Github, href: builderProfile.github, label: "GitHub", color: "#a1a1aa" });
  }
  // Also from contact methods
  contactMethods.forEach((cm) => {
    if (cm.type === "TELEGRAM" && cm.value) socialLinks.push({ icon: MessageCircle, href: `https://t.me/${cm.value}`, label: "Telegram", color: "#22d3ee" });
    if (cm.type === "X" && cm.value) socialLinks.push({ icon: Twitter, href: `https://x.com/${cm.value}`, label: "X", color: "#e4e4e7" });
    if (cm.type === "EMAIL" && cm.value) socialLinks.push({ icon: Mail, href: `mailto:${cm.value}`, label: "Email", color: "#a78bfa" });
    if (cm.type === "LINKEDIN" && cm.value) socialLinks.push({ icon: Linkedin, href: cm.value, label: "LinkedIn", color: "#0a66c2" });
  });

  // Dedupe by label
  const seenLabels = new Set<string>();
  const uniqueSocials = socialLinks.filter((s) => {
    if (seenLabels.has(s.label)) return false;
    seenLabels.add(s.label);
    return true;
  });

  const roleAccent =
    user.role === "FOUNDER" ? "#a78bfa"
      : user.role === "BUILDER" ? "#22d3ee"
        : user.role === "INVESTOR" ? "#34d399"
          : "#71717a";

  const roleAccentBg =
    user.role === "FOUNDER" ? "rgba(167,139,250,0.08)"
      : user.role === "BUILDER" ? "rgba(34,211,238,0.08)"
        : user.role === "INVESTOR" ? "rgba(52,211,153,0.08)"
          : "rgba(113,113,122,0.08)";

  const roleAccentBorder =
    user.role === "FOUNDER" ? "rgba(167,139,250,0.25)"
      : user.role === "BUILDER" ? "rgba(34,211,238,0.25)"
        : user.role === "INVESTOR" ? "rgba(52,211,153,0.25)"
          : "rgba(113,113,122,0.2)";

  const bannerGradient =
    user.role === "FOUNDER" ? "linear-gradient(135deg,#1a0e38 0%,#120828 40%,#0d0d0f 100%)"
      : user.role === "BUILDER" ? "linear-gradient(135deg,#061519 0%,#0c1e24 40%,#0d0d0f 100%)"
        : user.role === "INVESTOR" ? "linear-gradient(135deg,#03100a 0%,#071a10 40%,#0d0d0f 100%)"
          : "linear-gradient(135deg,#111114 0%,#0d0d0f 100%)";

  const profileCompletionPercent =
    user.role === "FOUNDER"
      ? (() => {
          const fields = [
            founderProfile?.companyName,
            founderProfile?.companyDescription,
            founderProfile?.roleTitle,
            founderProfile?.companyLogoUrl,
            founderProfile?.chainFocus,
            founderProfile?.projectStage,
            founderProfile?.currentNeeds,
            founderProfile?.website,
            founderProfile?.isHiring !== undefined ? "x" : null,
          ];
          const filled = fields.filter((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
          return Math.round((filled / fields.length) * 100);
        })()
      : user.role === "INVESTOR"
        ? (() => {
            const fields = [
              investorProfile?.firmName,
              investorProfile?.roleTitle,
              investorProfile?.focus,
              investorProfile?.website,
              investorProfile?.ticketSize,
              investorProfile?.lookingFor,
              investorProfile?.investmentThesis,
            ];
            const filled = fields.filter((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
            return Math.round((filled / fields.length) * 100);
          })()
        : (() => {
            const fields = [
              builderProfile?.title,
              builderProfile?.headline,
              builderProfile?.skills,
              builderProfile?.preferredChains,
              builderProfile?.openTo,
              builderProfile?.bio,
              builderProfile?.achievements,
              builderProfile?.openSourceContributions,
              builderProfile?.independent,
              builderProfile?.openToWork,
              builderProfile?.github || builderProfile?.portfolioUrl || builderProfile?.resumeUrl,
            ];
            const filled = fields.filter((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
            return Math.round((filled / fields.length) * 100);
          })();
  const minCompletionForPosting = 60;
  const canPublishToFeed = profileCompletionPercent >= minCompletionForPosting;

  return (
    <div className="space-y-4 py-6">

      {/* ═══════════════════════════════════════════════════════════════
          HERO CARD — Single unified card (like LinkedIn / Twitter)
         ═══════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-[18px]" style={{ border: "0.5px solid #1e1e24" }}>
        {/* Banner */}
        <div className="relative h-28 sm:h-36" style={{ background: bannerGradient }}>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${roleAccent}06 1px, transparent 1px), linear-gradient(90deg, ${roleAccent}06 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to top, #111114, transparent)" }} />
        </div>

        {/* Profile info */}
        <div className="px-5 pb-5 sm:px-6" style={{ backgroundColor: "#111114" }}>
          {/* Row: Avatar + Name + Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3.5">
              {/* Avatar */}
              <div className="-mt-10 shrink-0" style={{ filter: `drop-shadow(0 2px 10px ${roleAccent}18)` }}>
                <ProfileAvatar
                  src={user.image}
                  alt={user.name ?? "User"}
                  fallback={user.name?.charAt(0) ?? "U"}
                  className="h-[72px] w-[72px] rounded-[16px] border-[2.5px]"
                  fallbackClassName="border-[2.5px] border-[#111114] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-lg text-cyan-300 rounded-[16px]"
                />
              </div>

              {/* Name + socials */}
              <div className="pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: "#f4f4f5", letterSpacing: "-0.3px" }}>
                    {user.name ?? "Profile"}
                  </h1>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ backgroundColor: roleAccentBg, border: `0.5px solid ${roleAccentBorder}`, color: roleAccent }}>
                    {roleLabel}
                  </span>
                  {user.role === "FOUNDER" && founderHasValidCompany && founderAffiliation ? (
                    <ProfileAffiliationTag label={founderAffiliation.label} variant={founderAffiliation.variant} />
                  ) : null}
                  {user.role === "BUILDER" ? (
                    <ProfileAffiliationTag label={builderAffiliation.label} variant={builderAffiliation.variant} />
                  ) : null}
                  {user.role === "INVESTOR" && investorAffiliation ? (
                    <ProfileAffiliationTag label={investorAffiliation.label} variant="default" />
                  ) : null}
                </div>

                {/* Subtitle */}
                <p className="mt-0.5 text-[12px]" style={{ color: "#52525b" }}>
                  @{user.username ?? "user"} · {user.role === "FOUNDER" ? `${founderProfile?.roleTitle ?? "Founder"} at ${founderProfile?.companyName ?? "Company"}` : `${roleLabel} on Webcoin Labs`}
                </p>

                {/* Social icons row — RIGHT NEXT TO THE NAME */}
                {uniqueSocials.length > 0 ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    {uniqueSocials.map((s) => {
                      const Icon = s.icon;
                      return (
                        <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:scale-110"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid #27272a" }}
                          title={s.label}>
                          <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-0.5">
              {/* Edit Profile — scrolls to the form below */}
              <a href="#edit-profile"
                className="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12px] font-semibold transition-all hover:brightness-110"
                style={{ backgroundColor: roleAccentBg, border: `0.5px solid ${roleAccentBorder}`, color: roleAccent }}>
                <Pencil className="h-3 w-3" />
                Edit profile
              </a>
              {publicProfileHref ? (
                <Link href={publicProfileHref} target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12px] font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#a1a1aa" }}>
                  <Globe className="h-3 w-3" />
                  View public profile
                </Link>
              ) : null}
            </div>
          </div>

          {/* Bio */}
          {(founderProfile?.bio || builderProfile?.bio) ? (
            <p className="mt-3 max-w-lg text-[13px] leading-[1.6]" style={{ color: "#a1a1aa" }}>
              {founderProfile?.bio || builderProfile?.bio}
            </p>
          ) : null}

          {/* Stats bar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "#52525b" }}>
            {founderProfile?.location ? (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{founderProfile.location}</span>
            ) : null}
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{viewInsights.totalViews} profile views</span>
            <span>{recentPosts.length} posts</span>
            <span>{contactMethods.length} contact methods</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: roleVisibility ? "#34d399" : "#52525b" }} />
              {roleVisibility ? "Public" : "Private"}
            </span>
          </div>

          {/* Company card — Founder only, compact */}
          {user.role === "FOUNDER" ? (
            <div className="mt-4 flex items-center gap-3 rounded-[12px] p-3" style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}>
              <CompanyLogo
                src={founderProfile?.companyLogoUrl}
                alt={founderProfile?.companyName ?? "Company"}
                fallback={founderHasValidCompany ? founderCompanyName ?? "C" : "C"}
                className="h-10 w-10 rounded-xl border border-[#27272a] bg-[#0d0d0f] p-0.5"
                fallbackClassName="rounded-xl border border-[#27272a] bg-[#0d0d0f] text-xs text-muted-foreground"
                imgClassName="p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>{founderProfile?.companyName ?? "Company"}</p>
                <p className="text-[11px]" style={{ color: "#52525b" }}>
                  {founderProfile?.projectStage ?? "Stage not set"} · {founderProfile?.chainFocus ?? "Chain not set"} · {founderProfile?.isHiring ? "Hiring" : "Not hiring"}
                </p>
              </div>
              {founderProfile?.website ? (
                <a href={founderProfile.website} target="_blank" rel="noreferrer"
                  className="shrink-0 text-[11px] transition-opacity hover:opacity-80" style={{ color: "#a78bfa" }}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EDIT PROFILE SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <div id="edit-profile">
        {user.role === "BUILDER" ? <BuilderProfileForm initial={builderProfile} /> : null}
        {user.role === "FOUNDER" ? <FounderProfileForm initial={founderProfile} /> : null}
        {user.role === "INVESTOR" ? <InvestorProfileForm initial={investorProfile} /> : null}
        {user.role !== "BUILDER" && user.role !== "FOUNDER" && user.role !== "INVESTOR" ? (
          <div className="rounded-[14px] p-4 text-[13px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24", color: "#52525b" }}>
            Profile setup is available for Builder, Founder, and Investor roles.
          </div>
        ) : null}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SETTINGS GRID — 2 columns: left = visibility + contact, right = methods + feed
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* ─── Left: Visibility ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Profile Visibility</p>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: roleVisibility ? "rgba(16,185,129,0.1)" : "rgba(113,113,122,0.1)",
                  color: roleVisibility ? "#34d399" : "#71717a",
                  border: `0.5px solid ${roleVisibility ? "rgba(16,185,129,0.3)" : "#27272a"}`,
                }}>
                {roleVisibility ? "● Public" : "○ Private"}
              </span>
            </div>
          </div>
          <form
            action={async (formData: FormData) => { "use server"; await updateNetworkingSettings(formData); }}
            className="px-4 py-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: "PUBLIC", label: "Public", desc: "Visible on network", icon: "🌐" },
                { value: "PRIVATE", label: "Private", desc: "Only you", icon: "🔒" },
              ].map((opt) => {
                const isSelected = (roleVisibility ? "PUBLIC" : "PRIVATE") === opt.value;
                return (
                  <label key={opt.value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[10px] p-3 transition-colors"
                    style={{ backgroundColor: isSelected ? "#1a1030" : "transparent", border: `0.5px solid ${isSelected ? "#4c1d95" : "#27272a"}` }}>
                    <input type="radio" name="profileVisibility" value={opt.value} defaultChecked={isSelected} className="accent-violet-500" />
                    <div>
                      <span className="text-[12px] font-medium" style={{ color: "#e4e4e7" }}>{opt.icon} {opt.label}</span>
                      <p className="text-[10px]" style={{ color: "#3f3f46" }}>{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="space-y-0 rounded-[10px] overflow-hidden" style={{ border: "0.5px solid #1e1e24" }}>
              {[
                { name: "openToConnections", checked: publicSettings?.openToConnections ?? true, label: "Open to connections" },
                { name: "showInEcosystemFeed", checked: publicSettings?.showInEcosystemFeed ?? true, label: "Show in Ecosystem Feed" },
              ].map((item, idx) => (
                <label key={item.name}
                  className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[#1a1a1e]"
                  style={{ borderTop: idx > 0 ? "0.5px solid #1a1a1e" : undefined }}>
                  <span className="text-[12px]" style={{ color: "#d4d4d8" }}>{item.label}</span>
                  <input type="checkbox" name={item.name} value="true" defaultChecked={item.checked} className="h-3.5 w-3.5 accent-violet-500" />
                </label>
              ))}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "#71717a" }}>Public headline</label>
              <input name="preferredPublicHeadline"
                defaultValue={publicSettings?.preferredPublicHeadline ?? ""}
                placeholder="e.g. CEO at Acme · Builder · DeFi"
                className="w-full rounded-[10px] px-3 py-2 text-[12px] outline-none"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }} />
            </div>
            <button type="submit" className="w-full rounded-[10px] py-2 text-[12px] font-semibold transition-colors"
              style={{ backgroundColor: "#1a1040", border: "0.5px solid #4c1d95", color: "#a78bfa" }}>
              Save settings
            </button>
          </form>
        </section>

        {/* ─── Right: Contact Visibility ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Contact Visibility (Investor-only)</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#3f3f46" }}>Control what investors see on your public profile.</p>
          </div>
          <form
            action={async (formData: FormData) => { "use server"; await setContactVisibility(formData); }}
            className="px-4 py-4 space-y-3"
          >
            <div className="space-y-0 rounded-[10px] overflow-hidden" style={{ border: "0.5px solid #1e1e24" }}>
              {[
                { name: "showTelegramToInvestors", checked: publicSettings?.showTelegramToInvestors ?? true, label: "Show Telegram to investors", icon: MessageCircle },
                { name: "showLinkedinToInvestors", checked: publicSettings?.showLinkedinToInvestors ?? true, label: "Show LinkedIn to investors", icon: Linkedin },
                { name: "showEmailToInvestors", checked: publicSettings?.showEmailToInvestors ?? false, label: "Show email to investors", icon: Mail },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <label key={item.name}
                    className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[#1a1a1e]"
                    style={{ borderTop: idx > 0 ? "0.5px solid #1a1a1e" : undefined }}>
                    <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: "#d4d4d8" }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: "#52525b" }} /> {item.label}
                    </span>
                    <input type="checkbox" name={item.name} value="true" defaultChecked={item.checked} className="h-3.5 w-3.5 accent-cyan-500" />
                  </label>
                );
              })}
            </div>
            <button type="submit" className="w-full rounded-[10px] py-2 text-[12px] font-semibold transition-colors"
              style={{ backgroundColor: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
              Save contact visibility
            </button>
          </form>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONTACT METHODS + FEED — 2 columns
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* ─── Contact Methods ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Contact Methods</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#3f3f46" }}>Only enabled + public methods show on your public profile.</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <form
              action={async (formData: FormData) => { "use server"; await upsertProfileContactMethod(formData); }}
              className="grid grid-cols-[1fr_1fr_auto] gap-1.5"
            >
              <select name="type" className="rounded-[8px] px-2.5 py-2 text-[11px] outline-none"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }}>
                <option value="TELEGRAM">Telegram</option>
                <option value="EMAIL">Email</option>
                <option value="DISCORD">Discord</option>
                <option value="X">X</option>
                <option value="LINKEDIN">LinkedIn</option>
              </select>
              <input name="value" placeholder="Handle / URL" required
                className="rounded-[8px] px-2.5 py-2 text-[11px] outline-none"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }} />
              <input type="hidden" name="isPublic" value="true" />
              <button type="submit"
                className="flex items-center justify-center rounded-[8px] px-3 py-2 text-[11px] font-medium transition-colors"
                style={{ backgroundColor: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                <Plus className="h-3 w-3" />
              </button>
            </form>
            {contactMethods.length === 0 ? (
              <p className="text-[11px]" style={{ color: "#3f3f46" }}>No contact methods added yet.</p>
            ) : (
              <div className="space-y-1">
                {contactMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between rounded-[8px] px-3 py-2"
                    style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "#a1a1aa" }}>
                      <span className="font-medium" style={{ color: "#d4d4d8" }}>{method.type}</span>
                      <span style={{ color: "#3f3f46" }}>·</span>
                      <span className="truncate max-w-[120px]">{method.value}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[9px]"
                        style={{
                          backgroundColor: method.isPublic ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.08)",
                          color: method.isPublic ? "#34d399" : "#52525b",
                        }}>
                        {method.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <form action={async () => { "use server"; await deleteProfileContactMethod(method.id); }}>
                      <button type="submit" className="text-[10px] transition-opacity hover:opacity-80" style={{ color: "#52525b" }}>Remove</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Post to Feed ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Post to Ecosystem Feed</p>
          </div>
          {!canPublishToFeed ? (
            <div
              className="mx-4 mt-3 flex items-start gap-2 rounded-[10px] px-3 py-2 text-[11px]"
              style={{
                backgroundColor: "rgba(245,158,11,0.08)",
                border: "0.5px solid rgba(245,158,11,0.25)",
                color: "#fbbf24",
              }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Complete your profile to at least {minCompletionForPosting}% before posting. Current completion:{" "}
                {profileCompletionPercent}%.
              </span>
            </div>
          ) : null}
          <form
            action={async (formData: FormData) => { "use server"; await createFeedPost(formData); }}
            className="px-4 py-4 space-y-2"
          >
            <div className="grid grid-cols-2 gap-1.5">
              <select name="postType" className="rounded-[8px] px-2.5 py-2 text-[11px] outline-none"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }}>
                <option value="PRODUCT_UPDATE">Product update</option>
                <option value="MILESTONE_UPDATE">Milestone</option>
                <option value="HIRING_BUILDER">Hiring</option>
                <option value="FUNDRAISING_UPDATE">Fundraise</option>
                <option value="BUILDER_PROJECT">Project</option>
                <option value="ECOSYSTEM_SIGNAL">Signal</option>
              </select>
              <input name="title" placeholder="Title" required
                className="rounded-[8px] px-2.5 py-2 text-[11px] outline-none"
                style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }} />
            </div>
            <textarea name="body" rows={2} placeholder="What's happening?" required
              className="w-full rounded-[8px] px-2.5 py-2 text-[11px] outline-none resize-none"
              style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }} />
            <button type="submit"
              disabled={!canPublishToFeed}
              className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[11px] font-medium transition-colors"
              style={{
                backgroundColor: !canPublishToFeed ? "rgba(113,113,122,0.12)" : "rgba(34,211,238,0.06)",
                border: !canPublishToFeed ? "0.5px solid rgba(113,113,122,0.28)" : "0.5px solid rgba(34,211,238,0.2)",
                color: !canPublishToFeed ? "#71717a" : "#22d3ee",
              }}>
              <Send className="h-3 w-3" /> Publish
            </button>
          </form>
          {recentPosts.length > 0 ? (
            <div className="px-4 pb-4 space-y-1">
              {recentPosts.map((post) => (
                <div key={post.id} className="rounded-[8px] px-3 py-2 text-[11px]"
                  style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24", color: "#71717a" }}>
                  <span className="font-medium" style={{ color: "#a1a1aa" }}>{post.postType}</span> · {post.title}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM ROW: Profile Views + Link Identity
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* ─── Profile Views ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Who Viewed Your Profile</p>
              <span className="text-[11px] font-medium" style={{ color: roleAccent }}>{viewInsights.totalViews} total</span>
            </div>
          </div>
          <div className="px-4 py-4">
            {viewInsights.recentViewers.length === 0 ? (
              <p className="text-[11px]" style={{ color: "#3f3f46" }}>No profile views yet.</p>
            ) : (
              <div className="space-y-1.5">
                {viewInsights.recentViewers.map((entry) => (
                  <div key={`${entry.viewer.id}-${entry.viewedAt.toISOString()}`}
                    className="flex items-center justify-between rounded-[8px] px-3 py-2"
                    style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #1e1e24" }}>
                    <div className="flex items-center gap-2">
                      <ProfileAvatar
                        src={entry.viewer.image}
                        alt={entry.viewer.name ?? "Viewer"}
                        fallback={(entry.viewer.name ?? entry.viewer.username ?? "V").charAt(0)}
                        className="h-6 w-6 rounded-full"
                        fallbackClassName="bg-cyan-500/20 text-cyan-200 text-[10px]"
                      />
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "#d4d4d8" }}>{entry.viewer.name ?? entry.viewer.username ?? "Member"}</p>
                        <p className="text-[10px]" style={{ color: "#3f3f46" }}>{entry.viewer.role} · {entry.source}</p>
                      </div>
                    </div>
                    <p className="text-[10px]" style={{ color: "#3f3f46" }}>{new Date(entry.viewedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Link Profile ─── */}
        <section className="overflow-hidden rounded-[14px]" style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #1a1a1e" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>Link Founder / Builder Profile</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#3f3f46" }}>Show &quot;Also Founder / Also Builder&quot; on public profiles.</p>
          </div>
          <form
            action={async (formData: FormData) => { "use server"; await linkFounderBuilderIdentity(formData); }}
            className="px-4 py-4 flex gap-2"
          >
            <input name="toUsername" placeholder="Counterpart username"
              className="flex-1 rounded-[8px] px-3 py-2 text-[12px] outline-none"
              style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }} />
            <button type="submit"
              className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[11px] font-medium transition-colors"
              style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "0.5px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
              <Link2 className="h-3 w-3" /> Link
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

