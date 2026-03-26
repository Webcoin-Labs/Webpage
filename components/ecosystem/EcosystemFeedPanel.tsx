import Link from "next/link";
import { Role } from "@prisma/client";
import { db } from "@/server/db/client";
import { getEcosystemFeed, type FeedScope } from "@/lib/ecosystem-feed";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

const scopeTabs: Array<{ label: string; value: FeedScope }> = [
  { label: "Global Feed", value: "GLOBAL" },
  { label: "Founder Feed", value: "FOUNDER" },
  { label: "Builder Feed", value: "BUILDER" },
  { label: "Investor Feed", value: "INVESTOR" },
];

const postTypeLabels: Record<string, string> = {
  STARTUP_LAUNCH: "Startup launch",
  FUNDRAISING_UPDATE: "Fundraising",
  HIRING_BUILDER: "Hiring",
  PRODUCT_UPDATE: "Product update",
  BUILDER_PROJECT: "Builder project",
  OPEN_SOURCE_UPDATE: "Open source",
  BUILDER_AVAILABLE: "Builder available",
  INVESTOR_THESIS: "Investor thesis",
  INVESTOR_OPEN_CALL: "Open call",
  PORTFOLIO_UPDATE: "Portfolio",
  ECOSYSTEM_SIGNAL: "Ecosystem signal",
  MILESTONE_UPDATE: "Milestone",
};

function buildConnectLabel(viewerRole: Role | null | undefined, authorRole: Role) {
  if (viewerRole === "FOUNDER" && authorRole === "BUILDER") return "Invite Builder";
  if (viewerRole === "FOUNDER" && authorRole === "INVESTOR") return "Request Investor Intro";
  if (viewerRole === "BUILDER" && authorRole === "FOUNDER") return "Apply to Collaborate";
  if (viewerRole === "BUILDER" && authorRole === "INVESTOR") return "Pitch Technical Edge";
  if (viewerRole === "INVESTOR" && authorRole === "FOUNDER") return "Open Deal";
  if (viewerRole === "INVESTOR" && authorRole === "BUILDER") return "Request Technical Diligence";
  return "Connect";
}

function buildConnectHref(profileHref: string, viewerRole: Role | null | undefined) {
  return `${profileHref}?connect=1&source=ecosystem-feed${viewerRole ? `&viewerRole=${viewerRole}` : ""}`;
}

export async function EcosystemFeedPanel({
  basePath,
  defaultScope = "GLOBAL",
  search,
  scope,
  viewerRole,
}: {
  basePath: string;
  defaultScope?: FeedScope;
  search?: string;
  scope?: string;
  viewerRole?: Role | null;
}) {
  const activeScope = (scopeTabs.find((item) => item.value === scope)?.value ?? defaultScope) as FeedScope;
  const query = (search ?? "").trim();
  const [feedItems, founders, builders, investors] = await Promise.all([
    getEcosystemFeed({ scope: activeScope, search: query, take: 60 }),
    db.user.findMany({
      where: {
        founderProfile: { is: { publicVisible: true } },
        AND: [
          { OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { founderProfileLive: true } } }] },
          ...(query
            ? [{ OR: [{ name: { contains: query, mode: "insensitive" as const } }, { username: { contains: query, mode: "insensitive" as const } }] }]
            : []),
        ],
      },
      select: { id: true, name: true, username: true, image: true, founderProfile: { select: { roleTitle: true } } },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findMany({
      where: {
        builderProfile: { is: { publicVisible: true } },
        AND: [
          { OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { builderProfileLive: true } } }] },
          ...(query
            ? [{ OR: [{ name: { contains: query, mode: "insensitive" as const } }, { username: { contains: query, mode: "insensitive" as const } }] }]
            : []),
        ],
      },
      select: { id: true, name: true, username: true, image: true, builderProfile: { select: { title: true } } },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findMany({
      where: {
        investorProfile: { is: { isPublic: true } },
        AND: [
          { OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { investorProfileLive: true } } }] },
          ...(query
            ? [{ OR: [{ name: { contains: query, mode: "insensitive" as const } }, { username: { contains: query, mode: "insensitive" as const } }] }]
            : []),
        ],
      },
      select: { id: true, name: true, username: true, image: true, investorProfile: { select: { roleTitle: true } } },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              name="search"
              defaultValue={query}
              placeholder="Search founders, builders, investors, posts..."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200" type="submit">
              Search
            </button>
            <input type="hidden" name="scope" value={activeScope} />
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {scopeTabs.map((tab) => (
              <Link
                key={tab.value}
                href={`${basePath}?scope=${tab.value}${query ? `&search=${encodeURIComponent(query)}` : ""}`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  tab.value === activeScope ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-border text-muted-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </article>

        {feedItems.length === 0 ? (
          <article className="rounded-xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold">No visible ecosystem activity</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Publish a public profile and post your first update from Profile to activate your network feed.
            </p>
            <Link href="/app/profile" className="mt-4 inline-flex rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
              Open Profile Settings
            </Link>
          </article>
        ) : (
          feedItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-[0_8px_24px_-18px_rgba(34,211,238,0.55)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ProfileAvatar
                    src={item.authorImage}
                    alt={item.authorName}
                    fallback={item.authorName.charAt(0)}
                    className="h-9 w-9 rounded-full"
                    fallbackClassName="bg-cyan-500/20 text-cyan-200"
                  />
                  <div>
                    <p className="text-sm font-semibold leading-none tracking-tight">{item.authorName}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.authorRole} | {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                  {postTypeLabels[item.postType] ?? item.postType}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold leading-snug">{item.title}</h3>
              <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground whitespace-pre-wrap">{item.body}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(item.metadata)
                  .filter(([, value]) => value !== null && String(value).trim() !== "")
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <span key={`${item.id}-${key}`} className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {key}: {String(value)}
                    </span>
                  ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {item.authorProfileHref ? (
                  <>
                    <Link href={item.authorProfileHref} className="rounded-md border border-border px-2.5 py-1 hover:bg-accent/20">
                      Open Profile
                    </Link>
                    <Link
                      href={buildConnectHref(item.authorProfileHref, viewerRole)}
                      className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-200"
                    >
                      {buildConnectLabel(viewerRole, item.authorRole)}
                    </Link>
                  </>
                ) : item.authorOpenToConnections ? (
                  <Link
                    href={`/app/messages?source=ecosystem-feed${item.authorUsername ? `&username=${encodeURIComponent(item.authorUsername)}` : `&targetRole=${item.authorRole}`}`}
                    className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-200"
                  >
                    Request Connect
                  </Link>
                ) : (
                  <span className="rounded-md border border-border px-2.5 py-1 text-muted-foreground">
                    Private profile
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <aside className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Discovery</p>
          <p className="mt-1 text-sm font-semibold">Founders</p>
          <div className="mt-2 space-y-2">
            {founders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No public founders found.</p>
            ) : (
              founders.map((user) => (
                <Link key={user.id} href={user.username ? `/founder/${user.username}` : "#"} className="block rounded-md border border-border/50 px-3 py-2 text-xs hover:bg-accent/20">
                  {(user.name ?? "Founder")} | {user.founderProfile?.roleTitle ?? "Founder"}
                </Link>
              ))
            )}
          </div>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Builders</p>
          <div className="mt-2 space-y-2">
            {builders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No public builders found.</p>
            ) : (
              builders.map((user) => (
                <Link key={user.id} href={user.username ? `/builder/${user.username}` : "#"} className="block rounded-md border border-border/50 px-3 py-2 text-xs hover:bg-accent/20">
                  {(user.name ?? "Builder")} | {user.builderProfile?.title ?? "Builder"}
                </Link>
              ))
            )}
          </div>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Investors</p>
          <div className="mt-2 space-y-2">
            {investors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No public investors found.</p>
            ) : (
              investors.map((user) => (
                <Link key={user.id} href={user.username ? `/investor/${user.username}` : "#"} className="block rounded-md border border-border/50 px-3 py-2 text-xs hover:bg-accent/20">
                  {(user.name ?? "Investor")} | {user.investorProfile?.roleTitle ?? "Investor"}
                </Link>
              ))
            )}
          </div>
        </article>
      </aside>
    </section>
  );
}
