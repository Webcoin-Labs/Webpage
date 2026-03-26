import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

export const metadata = { title: "Profile - Webcoin Labs" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
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
    user.role === "FOUNDER"
      ? "founder"
      : user.role === "BUILDER"
        ? "builder"
        : user.role === "INVESTOR"
          ? "investor"
          : "member";

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={user.image}
              alt={user.name ?? "User"}
              fallback={user.name?.charAt(0) ?? "U"}
              className="h-12 w-12 rounded-xl"
              fallbackClassName="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-lg text-cyan-300"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold">{user.name ?? "Profile"}</h1>
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
              <p className="mt-1 text-sm text-muted-foreground">
                Your {roleLabel} profile visible to the Webcoin Labs network.
                {user.role === "FOUNDER" && founderProfile?.roleTitle ? ` ${founderProfile.roleTitle}.` : ""}
                {user.role === "FOUNDER"
                  ? ` ${founderProfile?.publicVisible === false ? "Currently private." : "Currently public."}`
                  : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border/60 px-2 py-0.5">Profile views: {viewInsights.totalViews}</span>
                <span className="rounded-full border border-border/60 px-2 py-0.5">Public posts: {recentPosts.length}</span>
                <span className="rounded-full border border-border/60 px-2 py-0.5">Contact methods: {contactMethods.length}</span>
              </div>
            </div>
          </div>
          {user.role === "FOUNDER" ? (
            <div className="flex items-center gap-3">
              <CompanyLogo
                src={founderProfile?.companyLogoUrl}
                alt={founderProfile?.companyName ?? "Company"}
                fallback={founderHasValidCompany ? founderCompanyName ?? "Company" : "Company"}
                className="h-11 w-11 rounded-xl border border-border/60 bg-background p-1"
                fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                imgClassName="p-1"
              />
              <div className="text-right text-xs text-muted-foreground">
                <p>{founderProfile?.roleTitle ?? "Founder"}</p>
                <p>{founderProfile?.isHiring ? "Hiring active" : "Hiring paused"}</p>
                <p>{founderProfile?.publicVisible === false ? "Private profile" : "Public profile"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {user.role === "BUILDER" ? <BuilderProfileForm initial={builderProfile} /> : null}
      {user.role === "FOUNDER" ? <FounderProfileForm initial={founderProfile} /> : null}
      {user.role === "INVESTOR" ? <InvestorProfileForm initial={investorProfile} /> : null}
      {user.role !== "BUILDER" && user.role !== "FOUNDER" && user.role !== "INVESTOR" ? (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Profile setup is available for Builder, Founder, and Investor roles.
        </div>
      ) : null}

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Networking Visibility</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Control profile visibility, ecosystem feed presence, and connection openness.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateNetworkingSettings(formData);
          }}
          className="mt-3 space-y-2"
        >
          <select name="profileVisibility" defaultValue={roleVisibility ? "PUBLIC" : "PRIVATE"} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="PUBLIC">Public profile</option>
            <option value="PRIVATE">Private profile</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="openToConnections" value="true" defaultChecked={publicSettings?.openToConnections ?? true} className="accent-cyan-500" />
            Open to connection requests
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="showInEcosystemFeed" value="true" defaultChecked={publicSettings?.showInEcosystemFeed ?? true} className="accent-cyan-500" />
            Show my activity in ecosystem feed
          </label>
          <input
            name="preferredPublicHeadline"
            defaultValue={publicSettings?.preferredPublicHeadline ?? ""}
            placeholder="Preferred public headline"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Save networking settings
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Contact Visibility (Investor-only)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Control whether Telegram, LinkedIn, and email are visible to authenticated investors on your public pages.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await setContactVisibility(formData);
          }}
          className="mt-3 space-y-2"
        >
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showTelegramToInvestors"
              value="true"
              defaultChecked={publicSettings?.showTelegramToInvestors ?? true}
              className="accent-cyan-500"
            />
            Show Telegram to investors
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showLinkedinToInvestors"
              value="true"
              defaultChecked={publicSettings?.showLinkedinToInvestors ?? true}
              className="accent-cyan-500"
            />
            Show LinkedIn to investors
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="showEmailToInvestors"
              value="true"
              defaultChecked={publicSettings?.showEmailToInvestors ?? false}
              className="accent-cyan-500"
            />
            Show email to investors
          </label>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Save contact visibility
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Public Contact Methods</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Add Telegram, Email, Discord, X, and LinkedIn methods. Only enabled + public methods are shown on your public profile.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await upsertProfileContactMethod(formData);
          }}
          className="mt-3 grid gap-2 md:grid-cols-6"
        >
          <select name="type" className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-1">
            <option value="TELEGRAM">Telegram</option>
            <option value="EMAIL">Email</option>
            <option value="DISCORD">Discord</option>
            <option value="X">X</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
          <input name="label" placeholder="Label (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-1" />
          <input name="value" placeholder="Handle / URL / email" required className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground md:col-span-1">
            <input type="checkbox" name="isPublic" value="true" defaultChecked className="accent-cyan-500" />
            Public
          </label>
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 md:col-span-1">
            Add method
          </button>
        </form>
        <div className="mt-3 space-y-2">
          {contactMethods.length === 0 ? (
            <p className="text-xs text-muted-foreground">No contact methods added yet.</p>
          ) : (
            contactMethods.map((method) => (
              <div key={method.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-xs">
                <span>
                  {method.type} · {method.label ?? "No label"} · {method.value} · {method.isPublic ? "Public" : "Private"} · {method.isEnabled ? "Enabled" : "Disabled"}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await deleteProfileContactMethod(method.id);
                  }}
                >
                  <button type="submit" className="rounded-md border border-border px-2 py-1">
                    Remove
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Post to Ecosystem Feed</h2>
        <p className="mt-1 text-xs text-muted-foreground">Publish concise startup ecosystem updates visible across Founder, Builder, and Investor OS.</p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await createFeedPost(formData);
          }}
          className="mt-3 space-y-2"
        >
          <div className="grid gap-2 md:grid-cols-2">
            <select name="postType" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="PRODUCT_UPDATE">Product update</option>
              <option value="MILESTONE_UPDATE">Milestone update</option>
              <option value="HIRING_BUILDER">Hiring builder</option>
              <option value="FUNDRAISING_UPDATE">Fundraising update</option>
              <option value="BUILDER_PROJECT">Builder project</option>
              <option value="OPEN_SOURCE_UPDATE">Open source update</option>
              <option value="BUILDER_AVAILABLE">Builder available</option>
              <option value="INVESTOR_THESIS">Investor thesis</option>
              <option value="INVESTOR_OPEN_CALL">Investor open call</option>
              <option value="ECOSYSTEM_SIGNAL">Ecosystem signal</option>
            </select>
            <input name="title" placeholder="Post title" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
          </div>
          <textarea name="body" rows={3} placeholder="Post body" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
          <input name="metadataJson" placeholder='Metadata JSON (optional), e.g. {"chain":"Base","stage":"MVP"}' className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs" />
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
            Publish
          </button>
        </form>
        <div className="mt-3 space-y-2">
          {recentPosts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
              No public feed posts yet. Share a milestone, launch, or update to appear in ecosystem discovery.
            </div>
          ) : (
            recentPosts.map((post) => (
              <p key={post.id} className="rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                {post.postType} · {post.title}
              </p>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Who Viewed Your Profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">One unique view per viewer per 24-hour window.</p>
        <p className="mt-2 text-sm font-medium">Total profile views: {viewInsights.totalViews}</p>
        <div className="mt-3 space-y-2">
          {viewInsights.recentViewers.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
              No profile views yet. Publish your profile and ecosystem posts to increase discovery.
            </div>
          ) : (
            viewInsights.recentViewers.map((entry) => (
              <div key={`${entry.viewer.id}-${entry.viewedAt.toISOString()}`} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <ProfileAvatar
                    src={entry.viewer.image}
                    alt={entry.viewer.name ?? "Viewer"}
                    fallback={(entry.viewer.name ?? entry.viewer.username ?? "V").charAt(0)}
                    className="h-7 w-7 rounded-full"
                    fallbackClassName="bg-cyan-500/20 text-cyan-200 text-xs"
                  />
                  <div>
                    <p className="text-xs font-medium">{entry.viewer.name ?? entry.viewer.username ?? "Member"}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.viewer.role} · {entry.source}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{new Date(entry.viewedAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Link Founder / Builder Profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Link a counterpart profile by username to display “Also Founder/Also Builder” cross-links publicly.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await linkFounderBuilderIdentity(formData);
          }}
          className="mt-3 flex gap-2"
        >
          <input name="toUsername" placeholder="Counterpart username" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Link profile
          </button>
        </form>
      </section>
    </div>
  );
}

