import {
  Activity,
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Handshake,
  Layers3,
  Network,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const navItems = [
  "Overview",
  "Founders",
  "Builders",
  "Matches",
  "Hiring",
  "Projects",
  "Pitch AI",
  "Jobs",
  "Network",
  "Admin",
];

const jobs = [
  { role: "Founding Engineer", tag: "Live" },
  { role: "Growth Lead", tag: "Early Access" },
  { role: "Smart Contract Dev", tag: "Hiring" },
];

const activity = [
  "Builder profile updated",
  "Founder enabled hiring",
  "Match created",
  "Pitch deck analyzed",
  "New job posted",
];

export function HeroDashboardPreview() {
  return (
    <div className="w-full max-h-[420px] aspect-[16/10] overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[0_20px_50px_-34px_rgba(2,6,23,0.95)] backdrop-blur">
      <div className="h-full w-full p-3">
        <div className="h-full w-full origin-top scale-[0.92] rounded-2xl border border-border/70 bg-[#070d1a] p-2.5">
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/70 bg-background/30 px-2.5 py-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-card">
            <Layers3 className="h-3.5 w-3.5 text-foreground" />
          </div>
          <span className="text-[11px] font-medium text-foreground">Webcoin Labs</span>
          <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-background/50 px-2 py-1">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span className="truncate text-[10px] text-muted-foreground">Search founders, builders, projects...</span>
          </div>
          <span className="hidden rounded-full border border-border/70 px-2 py-0.5 text-[9px] text-muted-foreground md:inline-flex">All</span>
          <span className="hidden rounded-full border border-border/70 px-2 py-0.5 text-[9px] text-muted-foreground md:inline-flex">Hiring</span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-300">
            Live Production
          </span>
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-6 w-6 rounded-full border border-border/70 bg-accent" />
        </div>

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
          <aside className="rounded-xl border border-border/70 bg-background/30 p-1.5">
            {navItems.slice(0, 7).map((item, index) => (
              <div
                key={item}
                className={`mb-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] ${
                  index === 0
                    ? "border border-blue-300/25 bg-blue-500/10 text-blue-100"
                    : "text-muted-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                <span>{item}</span>
              </div>
            ))}
          </aside>

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Handshake className="h-3 w-3 text-cyan-300" />
                  Founder-Builder Matches
                </p>
                <div className="mt-1.5 text-3xl font-semibold leading-none">128</div>
                <p className="mt-1 text-[10px] text-muted-foreground">High-intent collaboration pairs</p>
                <div className="mt-2 h-10 rounded-md border border-border/60 bg-background/50 p-1">
                  <svg viewBox="0 0 180 38" className="h-full w-full">
                    <path
                      d="M2 31 L18 29 L30 22 L45 24 L58 14 L72 21 L86 12 L102 17 L117 9 L132 14 L145 8 L176 10"
                      fill="none"
                      stroke="currentColor"
                      className="text-blue-300/90"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Activity className="h-3 w-3 text-amber-200" />
                  Hiring Pipeline
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    ["New", "28"],
                    ["Shortlisted", "14"],
                    ["In review", "17"],
                    ["Connected", "9"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <div className="text-[9px] text-muted-foreground">{k}</div>
                      <div className="text-sm font-medium leading-none">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <UsersRound className="h-3 w-3 text-emerald-300" />
                  Builder Availability
                </p>
                <div className="mt-2 space-y-1.5 text-[9px]">
                  {[
                    ["Independent", 44],
                    ["Available", 68],
                    ["Affiliated", 31],
                    ["Open to work", 72],
                  ].map(([k, n]) => (
                    <div key={k}>
                      <div className="mb-0.5 flex items-center justify-between text-muted-foreground">
                        <span>{k}</span>
                        <span>{n}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/70">
                        <div className="h-full rounded-full bg-blue-400/80" style={{ width: `${n}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Building2 className="h-3 w-3 text-cyan-300" />
                  Company Profiles
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                    <div className="text-[10px] font-medium">64 verified founders</div>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Verified
                    </span>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                    <div className="text-[10px] font-medium">31 hiring companies</div>
                    <span className="mt-1 inline-flex rounded-full border border-blue-300/30 bg-blue-500/10 px-1.5 py-0.5 text-[8px] text-blue-200">
                      Hiring
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <BrainCircuit className="h-3 w-3 text-violet-300" />
                  AI Pitch Readiness
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    ["Deck score", "92"],
                    ["Market clarity", "81"],
                    ["Hiring readiness", "74"],
                    ["Analysis queue", "12"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <div className="text-[8px] text-muted-foreground">{k}</div>
                      <div className="text-[10px] font-medium">{v}</div>
                    </div>
                  ))}
                </div>
                <span className="mt-1.5 inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-1.5 py-0.5 text-[8px] text-violet-200">
                  AI Ready
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                <div className="flex items-center justify-between">
                  <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <BriefcaseBusiness className="h-3 w-3 text-cyan-300" />
                    Jobs Marketplace
                  </p>
                  <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-1.5 py-0.5 text-[8px] text-amber-200">
                    Launching soon
                  </span>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {jobs.map((job) => (
                    <div key={job.role} className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <span className="text-[10px]">{job.role}</span>
                      <span className="text-[8px] text-muted-foreground">{job.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2.5">
                <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                  <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Network className="h-3 w-3 text-blue-300" />
                    Distribution Network
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <div className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <div className="text-[8px] text-muted-foreground">Partner nodes</div>
                      <div className="text-[10px] font-medium">26</div>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <div className="text-[8px] text-muted-foreground">Intros</div>
                      <div className="text-[10px] font-medium">84</div>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <div className="text-[8px] text-muted-foreground">Readiness</div>
                      <div className="text-[10px] font-medium">78%</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/35 p-2.5">
                  <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-cyan-300" />
                    Network Activity
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {activity.slice(0, 4).map((item, idx) => (
                      <div key={item} className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2 py-1">
                        <span className="text-[9px] text-muted-foreground">{item}</span>
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground">
                          <Clock3 className="h-2.5 w-2.5" />
                          {idx + 1}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
