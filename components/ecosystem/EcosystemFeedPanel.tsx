import Link from "next/link";
import { Role } from "@prisma/client";
import { ChevronRight, Globe, Lock, UserPlus } from "lucide-react";
import { db } from "@/server/db/client";
import { getEcosystemFeed, type EcosystemFeedItem, type FeedScope } from "@/lib/ecosystem-feed";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

const scopeTabs: Array<{ label: string; value: FeedScope }> = [
  { label: "All", value: "GLOBAL" },
  { label: "Founders", value: "FOUNDER" },
  { label: "Builders", value: "BUILDER" },
  { label: "Investors", value: "INVESTOR" },
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
  ECOSYSTEM_SIGNAL: "Signal",
  MILESTONE_UPDATE: "Milestone",
};

export type FeedActionKind =
  | "OPEN_PROFILE"
  | "VIEW_STARTUP"
  | "VIEW_PROJECT"
  | "CONNECT"
  | "REQUEST_INTRO"
  | "REQUEST_MEETING";

type FeedAction = {
  kind: FeedActionKind;
  label: string;
  href: string;
  primary?: boolean;
};

function buildConnectLabel(viewerRole: Role | null | undefined, authorRole: Role) {
  if (viewerRole === "FOUNDER" && authorRole === "BUILDER") return "Invite Builder";
  if (viewerRole === "FOUNDER" && authorRole === "INVESTOR") return "Request Meeting";
  if (viewerRole === "BUILDER" && authorRole === "FOUNDER") return "Offer Help";
  if (viewerRole === "INVESTOR" && authorRole === "FOUNDER") return "Request Intro";
  return "Connect";
}

function buildConnectHref(profileHref: string, viewerRole: Role | null | undefined) {
  return `${profileHref}?connect=1&source=ecosystem-feed${viewerRole ? `&viewerRole=${viewerRole}` : ""}`;
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function roleBadge(role: string) {
  if (role === "FOUNDER") return { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", label: "Founder" };
  if (role === "BUILDER") return { bg: "rgba(52,211,153,0.1)", color: "#34d399", label: "Builder" };
  if (role === "INVESTOR") return { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", label: "Investor" };
  return { bg: "rgba(113,113,122,0.1)", color: "#71717a", label: role };
}

function buildStartupHref(item: EcosystemFeedItem, viewerRole: Role | null | undefined) {
  if (!item.relatedVentureId) return null;
  if (viewerRole === "FOUNDER") return `/app/founder-os/ventures/${item.relatedVentureId}`;
  return `/app/investor-os/ventures/${item.relatedVentureId}`;
}

function buildProjectHref(item: EcosystemFeedItem) {
  if (!item.relatedProjectId) return null;
  return `/app/builder-os/projects/${item.relatedProjectId}`;
}

function buildExecutionActions(item: EcosystemFeedItem, viewerRole: Role | null | undefined): FeedAction[] {
  const actions: FeedAction[] = [];
  const startupHref = buildStartupHref(item, viewerRole);
  const projectHref = buildProjectHref(item);

  if (item.authorProfileHref) {
    actions.push({ kind: "OPEN_PROFILE", label: "Open Profile", href: item.authorProfileHref });
  }
  if (startupHref) {
    actions.push({ kind: "VIEW_STARTUP", label: "View Startup", href: startupHref });
  }
  if (projectHref) {
    actions.push({ kind: "VIEW_PROJECT", label: "View Project", href: projectHref });
  }
  if (item.authorProfileHref && item.authorOpenToConnections) {
    actions.push({
      kind: "CONNECT",
      label: buildConnectLabel(viewerRole, item.authorRole as Role),
      href: buildConnectHref(item.authorProfileHref, viewerRole),
      primary: true,
    });
  }
  if (viewerRole === "INVESTOR" && item.authorRole === "FOUNDER") {
    actions.push({
      kind: "REQUEST_INTRO",
      label: "Request Intro",
      href: `/app/investor-os/deal-flow?source=ecosystem-feed&target=${item.authorUserId}`,
      primary: true,
    });
  }
  if (viewerRole === "FOUNDER" && item.authorRole === "INVESTOR") {
    actions.push({
      kind: "REQUEST_MEETING",
      label: "Request Meeting",
      href: `/app/founder-os/investor-connect?source=ecosystem-feed&target=${item.authorUserId}`,
      primary: true,
    });
  }
  return actions;
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
      select: { id: true, name: true, username: true, image: true, founderProfile: { select: { roleTitle: true, companyName: true } } },
      take: 8,
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
      take: 8,
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
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <div
          className="rounded-[14px] p-4"
          style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
        >
          <form className="flex gap-2">
            <input
              name="search"
              defaultValue={query}
              placeholder="Search founders, builders, investors, updates..."
              className="flex-1 rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ backgroundColor: "#0d0d0f", border: "0.5px solid #27272a", color: "#d4d4d8" }}
            />
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-[12px] font-medium"
              style={{ backgroundColor: "#1a1040", border: "0.5px solid #4c1d95", color: "#a78bfa" }}
            >
              Search
            </button>
            <input type="hidden" name="scope" value={activeScope} />
          </form>
          <div className="mt-3 flex gap-1">
            {scopeTabs.map((tab) => (
              <Link
                key={tab.value}
                href={`${basePath}?scope=${tab.value}${query ? `&search=${encodeURIComponent(query)}` : ""}`}
                className="rounded-lg px-4 py-1.5 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: tab.value === activeScope ? "#1a1030" : "transparent",
                  color: tab.value === activeScope ? "#a78bfa" : "#52525b",
                  border: `0.5px solid ${tab.value === activeScope ? "#4c1d95" : "transparent"}`,
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {feedItems.length === 0 ? (
          <div
            className="rounded-[14px] p-10 text-center"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <Globe className="mx-auto mb-3 h-8 w-8" style={{ color: "#3f3f46" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#d4d4d8" }}>
              No ecosystem activity yet
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "#71717a" }}>
              Publish a public profile and share real execution updates to activate the network feed.
            </p>
            <Link
              href="/app/profile"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium"
              style={{ backgroundColor: "#1a1040", border: "0.5px solid #4c1d95", color: "#a78bfa" }}
            >
              Open Profile Settings
            </Link>
          </div>
        ) : (
          feedItems.map((item) => {
            const badge = roleBadge(item.authorRole as string);
            const actions = buildExecutionActions(item, viewerRole);

            return (
              <article
                key={item.id}
                className="rounded-[14px] overflow-hidden"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div className="flex items-start gap-3">
                    <ProfileAvatar
                      src={item.authorImage}
                      alt={item.authorName}
                      fallback={item.authorName.charAt(0)}
                      className="h-10 w-10 rounded-full shrink-0"
                      fallbackClassName="rounded-full text-sm font-semibold"
                      style={{ backgroundColor: "#1a1040", color: "#a78bfa" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>
                          {item.authorName}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px]" style={{ color: "#52525b" }}>
                        {timeAgo(item.createdAt)}
                        {item.authorOpenToConnections ? (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" /> Open to connect
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Closed
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium"
                    style={{ backgroundColor: "rgba(113,113,122,0.1)", color: "#a1a1aa" }}
                  >
                    {postTypeLabels[item.postType] ?? item.postType}
                  </span>
                </div>

                <div className="px-4 pt-3">
                  <h3 className="text-[14px] font-semibold leading-snug" style={{ color: "#e4e4e7" }}>
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-6 line-clamp-4" style={{ color: "#a1a1aa" }}>
                    {item.body}
                  </p>
                </div>

                {Object.keys(item.metadata).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 px-4">
                    {Object.entries(item.metadata)
                      .filter(([, value]) => value !== null && String(value).trim() !== "")
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <span
                          key={`${item.id}-${key}`}
                          className="rounded-full px-2.5 py-0.5 text-[10px]"
                          style={{ backgroundColor: "#1a1a1e", color: "#71717a", border: "0.5px solid #27272a" }}
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-3 px-4 pb-4 pt-3" style={{ borderTop: "0.5px solid #1a1a1e" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    {actions.map((action) => (
                      <Link
                        key={`${item.id}-${action.kind}-${action.href}`}
                        href={action.href}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium"
                        style={
                          action.primary
                            ? { backgroundColor: "#1a1040", border: "0.5px solid #4c1d95", color: "#a78bfa" }
                            : { backgroundColor: "#151519", border: "0.5px solid #27272a", color: "#a1a1aa" }
                        }
                      >
                        {action.kind === "CONNECT" || action.kind === "REQUEST_INTRO" || action.kind === "REQUEST_MEETING" ? (
                          <UserPlus className="h-3 w-3" />
                        ) : null}
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <aside className="space-y-4">
        {[
          {
            label: "Founders",
            people: founders,
            getHref: (user: (typeof founders)[number]) => (user.username ? `/founder/${user.username}` : "#"),
            getTitle: (user: (typeof founders)[number]) => user.founderProfile?.roleTitle ?? "Founder",
            getSub: (user: (typeof founders)[number]) => user.founderProfile?.companyName ?? "",
          },
          {
            label: "Builders",
            people: builders,
            getHref: (user: (typeof builders)[number]) => (user.username ? `/builder/${user.username}` : "#"),
            getTitle: (user: (typeof builders)[number]) => user.builderProfile?.title ?? "Builder",
            getSub: () => "",
          },
          {
            label: "Investors",
            people: investors,
            getHref: (user: (typeof investors)[number]) => (user.username ? `/investor/${user.username}` : "#"),
            getTitle: (user: (typeof investors)[number]) => user.investorProfile?.roleTitle ?? "Investor",
            getSub: () => "",
          },
        ].map(({ label, people, getHref, getTitle, getSub }) =>
          people.length === 0 ? null : (
            <div
              key={label}
              className="rounded-[14px] overflow-hidden"
              style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <h3 className="text-[12px] font-semibold" style={{ color: "#a1a1aa" }}>
                  {label} to connect with
                </h3>
                <Link
                  href={`${basePath}?scope=${label.toUpperCase().slice(0, -1)}`}
                  className="text-[11px]"
                  style={{ color: "#a78bfa" }}
                >
                  See all
                </Link>
              </div>
              <div className="space-y-1 px-3 pb-3">
                {people.slice(0, 5).map((user) => (
                  <Link
                    key={user.id}
                    href={getHref(user as never)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#1a1a1e]"
                  >
                    <ProfileAvatar
                      src={user.image}
                      alt={user.name ?? label}
                      fallback={(user.name ?? label).charAt(0)}
                      className="h-8 w-8 rounded-full shrink-0"
                      fallbackClassName="rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "#1a1040", color: "#a78bfa" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium" style={{ color: "#d4d4d8" }}>
                        {user.name ?? label}
                      </p>
                      <p className="truncate text-[10px]" style={{ color: "#52525b" }}>
                        {getTitle(user as never)}
                        {getSub(user as never) ? ` - ${getSub(user as never)}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "#3f3f46" }} />
                  </Link>
                ))}
              </div>
            </div>
          ),
        )}

        <div
          className="rounded-[14px] p-4"
          style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
        >
          <p className="text-[12px] font-semibold" style={{ color: "#a1a1aa" }}>
            Share an execution update
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "#52525b" }}>
            Post milestones, hiring updates, and delivery signals to improve discovery quality.
          </p>
          <Link
            href="/app/profile#post"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors"
            style={{ backgroundColor: "#1a1040", border: "0.5px solid #4c1d95", color: "#a78bfa" }}
          >
            Create post
          </Link>
        </div>
      </aside>
    </div>
  );
}
