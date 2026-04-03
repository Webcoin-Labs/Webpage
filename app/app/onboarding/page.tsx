"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AtSign, Briefcase, Building2, CheckCircle2, Coins, FileText, Globe, Globe2, ImagePlus, Linkedin, Loader2, Rocket, ShieldCheck, Sparkles, UserRound, Wallet } from "lucide-react";
import {
  completeWorkspaceOnboarding,
  getOnboardingResumeState,
  parseBuilderResumeForOnboarding,
  saveOnboardingIntegrations,
  saveOnboardingTermsAcceptance,
  saveOnboardingWorkspaceSelection,
  saveProfileIdentity,
  saveWalletConnection,
} from "@/app/actions/webcoin-os";
import { IntegrationBrandIcon } from "@/components/integrations/IntegrationBrandIcon";

type WorkspaceChoice = "FOUNDER_OS" | "BUILDER_OS" | "INVESTOR_OS";

const stepLabels = ["Terms", "Workspace", "Identity", "Role Setup", "Integrations", "Preview"];

const integrationOptions = [
  "GMAIL",
  "GOOGLE_CALENDAR",
  "NOTION",
  "GITHUB",
  "JIRA",
  "CALENDLY",
  "CAL_DOT_COM",
  "FARCASTER",
] as const;

const integrationLabels: Record<(typeof integrationOptions)[number], string> = {
  GMAIL: "Gmail",
  GOOGLE_CALENDAR: "Google Calendar",
  NOTION: "Notion",
  GITHUB: "GitHub",
  JIRA: "Jira",
  CALENDLY: "Calendly",
  CAL_DOT_COM: "Cal.com",
  FARCASTER: "Farcaster",
};

function StepBadge({ value, active }: { value: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-200"
          : "rounded-full border border-border/60 bg-card px-2 py-1 text-[10px] text-muted-foreground"
      }
    >
      {value}
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isHydrating, setIsHydrating] = useState(true);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isResumePending, startResumeTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspaceChoice>("FOUNDER_OS");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [educationBackground, setEducationBackground] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [roleInputs, setRoleInputs] = useState<Record<string, string>>({});
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState<"EVM" | "SOLANA">("EVM");
  const usernameLocked = Boolean(session?.user?.username);
  const resumeRequested = searchParams.get("resume") === "1";

  useEffect(() => {
    let isMounted = true;
    void getOnboardingResumeState()
      .then((result) => {
        if (!isMounted || !result.success) return;
        setStep(result.step);
        setTermsAccepted(result.termsAccepted);
        setWorkspace(result.workspace);
        setName(result.identity.name);
        setUsername(result.identity.username);
        setBio(result.identity.bio);
        setEducationBackground(result.identity.educationBackground);
        setTwitter(result.identity.twitter);
        setLinkedin(result.identity.linkedin);
        setWebsite(result.identity.website);
        setAvatarPreview(result.identity.avatarPreview || null);
        setRoleInputs(result.roleInputs);
        setIntegrations(result.integrations);
        setWalletNetwork(result.wallet.network);
        setWalletAddress(result.wallet.address);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsHydrating(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    if (!name && session.user.name) setName(session.user.name);
    if (!username && session.user.username) setUsername(session.user.username);
    if (!avatarFile && !avatarPreview && session.user.image) setAvatarPreview(session.user.image);
  }, [session, name, username, avatarFile, avatarPreview]);

  useEffect(() => {
    if (!avatarFile) return undefined;
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const workspaceDescriptor = useMemo(() => {
    if (workspace === "FOUNDER_OS") return { title: "Founder OS", icon: Rocket, copy: "Venture building, deck, investor outreach, builder discovery." };
    if (workspace === "INVESTOR_OS") return { title: "Investor OS", icon: Building2, copy: "Deal-flow, thesis, founder applications, and scheduling." };
    return { title: "Builder OS", icon: Briefcase, copy: "Proof-of-work profile, projects, GitHub, resume, and opportunity intent." };
  }, [workspace]);

  const workspaceDetails = useMemo(() => {
    if (workspace === "FOUNDER_OS") {
      return {
        title: "Founder OS",
        summary: "Built for founders operating ventures, fundraising pipelines, token design, deck workflows, and investor relationships from one command layer.",
        features: [
          "Command Center, ventures, deck intelligence, and raise workflow",
          "Builder discovery, investor connect, meetings, and market intelligence",
          "Operator-style startup profile with fundraising and venture context",
        ],
      };
    }

    if (workspace === "INVESTOR_OS") {
      return {
        title: "Investor OS",
        summary: "Designed for angels, funds, scouts, and operator-investors managing thesis, deal flow, founder applications, and research signals.",
        features: [
          "Investor identity, thesis fit, and role-aware public routing",
          "Founder application review, watchlist thinking, and diligence workflows",
          "Deal discovery surfaces tied to sectors, stages, and chain focus",
        ],
      };
    }

    return {
      title: "Builder OS",
      summary: "Made for builders who want a strong proof-of-work identity, project portfolio, GitHub-backed credibility, and better opportunity matching.",
      features: [
        "Project portfolio, resume tools, cover workflows, and open-source proof",
        "GitHub-linked builder identity with stack, skills, and chain expertise",
        "Opportunity intent and discovery surfaces for teams seeking builders",
      ],
    };
  }, [workspace]);

  const toggleIntegration = (provider: string) => {
    setIntegrations((prev) => (prev.includes(provider) ? prev.filter((item) => item !== provider) : [...prev, provider]));
  };

  const setRoleField = (field: string, value: string) => {
    setRoleInputs((current) => ({ ...current, [field]: value }));
  };

  const saveIdentity = () => {
    setError("");
    setSuccess("");
    if (name.trim().length < 2) {
      setError("Name is required.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Unique username is required.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("username", username.toLowerCase().replace(/[^a-z0-9_]/g, ""));
      fd.set("bio", bio);
      fd.set("educationBackground", educationBackground);
      fd.set("twitter", twitter);
      fd.set("linkedin", linkedin);
      fd.set("website", website);
      if (avatarFile) fd.set("avatarFile", avatarFile);
      const result = await saveProfileIdentity(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep(3);
    });
  };

  const saveRoleSetup = () => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("workspace", workspace);
      Object.entries(roleInputs).forEach(([k, v]) => fd.set(k, v));
      const result = await completeWorkspaceOnboarding(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep(4);
    });
  };

  const autofillBuilderFromResume = () => {
    if (!resumeFile) {
      setError("Upload a PDF or DOCX resume first.");
      return;
    }
    setError("");
    setSuccess("");
    startResumeTransition(async () => {
      const fd = new FormData();
      fd.set("resumeFile", resumeFile);
      const result = await parseBuilderResumeForOnboarding(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRoleInputs((current) => ({ ...current, ...result.fields }));
      if (!bio && result.fields.builderDescription) setBio(result.fields.builderDescription);
      if (!educationBackground && result.fields.educationBackground) setEducationBackground(result.fields.educationBackground);
      if (!linkedin && result.fields.linkedin) setLinkedin(result.fields.linkedin);
      if (!twitter && result.fields.twitter) setTwitter(result.fields.twitter);
      if (!website && result.fields.portfolioUrl) setWebsite(result.fields.portfolioUrl);
      setSuccess("Resume parsed. Review and refine the autofilled builder details.");
    });
  };

  const saveIntegrations = () => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const fd = new FormData();
      integrations.forEach((provider) => fd.append("providers", provider));
      const result = await saveOnboardingIntegrations(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep(5);
    });
  };

  const saveWallet = () => {
    if (!walletAddress) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("network", walletNetwork);
      fd.set("provider", walletNetwork === "EVM" ? "METAMASK" : "PHANTOM");
      fd.set("address", walletAddress);
      const result = await saveWalletConnection(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Wallet linked.");
    });
  };

  const connectEvmWallet = async () => {
    try {
      const ethereum = (window as Window & { ethereum?: { request: (payload: { method: string }) => Promise<string[]> } }).ethereum;
      if (!ethereum) {
        setError("No EVM wallet detected. Install MetaMask or Coinbase Wallet.");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts[0]) {
        setWalletNetwork("EVM");
        setWalletAddress(accounts[0]);
      }
    } catch {
      setError("Unable to connect EVM wallet.");
    }
  };

  const connectSolanaWallet = async () => {
    try {
      const solana = (window as Window & { solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana;
      if (!solana) {
        setError("No Solana wallet detected. Install Phantom.");
        return;
      }
      const response = await solana.connect();
      const address = response.publicKey?.toString();
      if (address) {
        setWalletNetwork("SOLANA");
        setWalletAddress(address);
      }
    } catch {
      setError("Unable to connect Solana wallet.");
    }
  };

  if (isHydrating) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center py-16">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Restoring your onboarding progress...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {stepLabels.map((label, index) => (
            <StepBadge key={label} value={`${index + 1}. ${label}`} active={index === step} />
          ))}
        </div>
        {resumeRequested ? (
          <div className="mb-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
            Resumed onboarding mode is active. Your latest saved step is loaded automatically.
          </div>
        ) : null}

        {step === 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2">
                <FileText className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Terms, identity, and responsible platform use</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review the core terms for profile authenticity, integrations, wallet identity, fundraising materials, and public visibility before opening your workspace.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="max-h-[360px] space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground">
                <p className="leading-6">
                  Webcoin Labs is a multi-role operating platform for founders, builders, and investors. By continuing, you confirm that any identity details, startup information, fundraising materials, public claims, and contact methods you publish through the platform are accurate, permissioned, and lawful to share.
                </p>
                <p className="leading-6">
                  Your account may power role-based profiles, public routes, discovery surfaces, integrations, wallet-linked identity, venture workflows, and premium-gated actions. You remain responsible for the accuracy of your public profile, private workspace content, and any third-party data you connect or expose.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="font-semibold text-foreground">Identity and accuracy</p>
                    <p className="mt-2 text-xs leading-5">
                      Do not impersonate people, companies, funds, or projects. Founder, investor, and builder claims must reflect your actual role, background, and relationship to the work you showcase.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="font-semibold text-foreground">Privacy and outreach</p>
                    <p className="mt-2 text-xs leading-5">
                      Respect visibility settings and contact preferences. Messaging, intros, and outreach must remain relevant, non-abusive, and compliant with applicable privacy and anti-spam expectations.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="font-semibold text-foreground">Wallets and integrations</p>
                    <p className="mt-2 text-xs leading-5">
                      Connect only wallets, calendars, repos, mailboxes, and workspaces you personally control or are authorized to operate. Unauthorized linking or data access can lead to connector restrictions.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="font-semibold text-foreground">Fundraising and platform risk</p>
                    <p className="mt-2 text-xs leading-5">
                      Pitch decks, tokenomics, market intelligence, and investor workflows are support tools only. Webcoin Labs does not guarantee fundraising outcomes, diligence approval, token performance, or regulatory compliance.
                    </p>
                  </div>
                </div>
                <p className="leading-6">
                  Abuse, fraud, malicious uploads, policy evasion, or misuse of discovery and identity systems may lead to content removal, rate limits, profile visibility restrictions, premium loss, or account suspension. By proceeding, you agree to use the platform responsibly and understand that these terms may be updated as the product evolves.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 accent-cyan-500"
              />
              <span className="text-muted-foreground">
                I accept the Webcoin Labs terms and confirm that my identity, profile content, and connected services will be truthful, permissioned, and used in accordance with platform rules.
              </span>
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={() => router.push("/login")} className="rounded-lg border border-border px-3 py-2 text-xs">
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!termsAccepted) {
                    setError("Accept the terms to continue.");
                    return;
                  }
                  setError("");
                  startTransition(async () => {
                    const result = await saveOnboardingTermsAcceptance(true);
                    if (!result.success) {
                      setError(result.error);
                      return;
                    }
                    setStep(1);
                  });
                }}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Choose Your Workspace</h1>
            <p className="text-sm text-muted-foreground">You can enable multiple workspaces later from the workspace switcher.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: "FOUNDER_OS", title: "Founder OS", icon: Rocket, desc: "Startup ops, fundraising, deck intelligence, builder + investor workflows." },
                { value: "BUILDER_OS", title: "Builder OS", icon: Briefcase, desc: "Projects, open source proof, resume/cover letter, collaboration intent." },
                { value: "INVESTOR_OS", title: "Investor OS", icon: Building2, desc: "Public investor identity, thesis fit, and founder applications inbox." },
              ].map((item) => {
                const Icon = item.icon;
                const active = workspace === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setWorkspace(item.value as WorkspaceChoice)}
                    className={
                      active
                        ? "rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-left"
                        : "rounded-xl border border-border/60 bg-background p-4 text-left hover:border-border"
                    }
                  >
                    <Icon className="mb-2 h-4 w-4 text-cyan-300" />
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  const result = await saveOnboardingWorkspaceSelection(workspace);
                  if (!result.success) {
                    setError(result.error);
                    return;
                  }
                  const hasIdentity = name.trim().length >= 2 && username.trim().length >= 3;
                  setStep(hasIdentity ? 3 : 2);
                })
              }
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
            >
              Continue
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Identity Setup</h2>
            <p className="text-sm text-muted-foreground">Set the profile people will recognize across public pages, intros, and workspace discovery.</p>
            <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
              <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
                <div className="h-28 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_50%),linear-gradient(135deg,rgba(8,12,18,1),rgba(14,22,34,1))]" />
                <div className="px-5 pb-5">
                  <div className="-mt-10 flex items-end justify-between gap-3">
                    <label className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card shadow-lg shadow-black/20">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-9 w-9 text-cyan-200" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                      />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                        <ImagePlus className="h-3 w-3" />
                        Change
                      </span>
                    </label>
                    <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
                      Profile preview
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-lg font-semibold text-foreground">{name || "Your name"}</p>
                    <p className="mt-1 text-sm text-cyan-200">@{(username || "username").toLowerCase().replace(/[^a-z0-9_]/g, "") || "username"}</p>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                      {bio || "Add a concise founder, builder, or investor description so your profile feels credible the moment someone lands on it."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-1">Public identity</span>
                    <span className="rounded-full border border-border px-2 py-1">Role-aware routing</span>
                    <span className="rounded-full border border-border px-2 py-1">Social links</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Display name</p>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Username</p>
                      <span className="text-[11px] text-muted-foreground">This becomes your handle</span>
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm"
                        disabled={usernameLocked}
                        readOnly={usernameLocked}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {usernameLocked ? "Your username is already locked for this account." : "Use lowercase letters, numbers, and underscore only."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Profile bio</p>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Describe what you build, invest in, or operate in one strong paragraph." className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Education or background</p>
                  <textarea
                    value={educationBackground}
                    onChange={(e) => setEducationBackground(e.target.value)}
                    rows={3}
                    placeholder="School, previous roles, notable background, or credibility markers."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">X / Twitter</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-cyan-200">X</span>
                      <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/username" className="w-full rounded-xl border border-border bg-background px-9 py-3 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">LinkedIn</p>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Website</p>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Back
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={saveIdentity}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            {/* Step Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
                <workspaceDescriptor.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{workspaceDescriptor.title} Setup</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{workspaceDescriptor.copy}</p>
              </div>
            </div>
            {workspace === "FOUNDER_OS" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Venture details</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Startup / company name</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, companyName: e.target.value }))} placeholder="e.g. Acme Protocol" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Company description</label>
                      <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, companyDescription: e.target.value }))} rows={3} placeholder="What does your company do? What problem are you solving?" className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Chain / ecosystem focus</label>
                        <input onChange={(e) => setRoleInputs((s) => ({ ...s, chainFocus: e.target.value }))} placeholder="Ethereum, Solana, Base" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Stage</label>
                        <input onChange={(e) => setRoleInputs((s) => ({ ...s, stage: e.target.value }))} placeholder="Idea, MVP, Growth, Live" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Looking for <span className="normal-case font-normal text-muted-foreground/60">(comma-separated)</span></label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, lookingForCsv: e.target.value }))} placeholder="Developers, investors, co-founder, partners…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Founder description</label>
                      <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, founderDescription: e.target.value }))} rows={2} placeholder="Your background, experience, and why you are the right person to build this." className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {workspace === "BUILDER_OS" ? (
              <div className="space-y-4">
                {/* AI Resume Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-transparent p-5">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                      <Sparkles className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">AI Resume Autofill</p>
                      <p className="text-xs text-muted-foreground">Upload once — we fill role, skills, stack, and links automatically</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-sm transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/10">
                      <FileText className="h-4 w-4 flex-shrink-0 text-cyan-300" />
                      <span className="truncate text-foreground">{resumeFile ? resumeFile.name : "Choose PDF or DOCX resume"}</span>
                      <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
                    </label>
                    <button type="button" onClick={autofillBuilderFromResume} disabled={isResumePending || !resumeFile} className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-3 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40">
                      {isResumePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isResumePending ? "Parsing…" : "Autofill"}
                    </button>
                  </div>
                </div>

                {/* Identity */}
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identity</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Role title</label>
                      <input value={roleInputs.title ?? ""} onChange={(e) => setRoleField("title", e.target.value)} placeholder="Fullstack Engineer, Smart Contract Dev…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Availability</label>
                      <input value={roleInputs.availability ?? ""} onChange={(e) => setRoleField("availability", e.target.value)} placeholder="Immediate, Full-time, Contract…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Professional summary</label>
                    <textarea value={roleInputs.builderDescription ?? ""} onChange={(e) => setRoleField("builderDescription", e.target.value)} rows={4} placeholder="Summarize your proof-of-work, strongest capabilities, and the kind of teams you are best suited for." className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                  </div>
                </div>

                {/* Skills & Stack */}
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills & Stack</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Core skills <span className="normal-case font-normal text-muted-foreground/60">(comma-separated)</span></label>
                      <input value={roleInputs.skillsCsv ?? ""} onChange={(e) => setRoleField("skillsCsv", e.target.value)} placeholder="TypeScript, React, Solidity…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Tech stack <span className="normal-case font-normal text-muted-foreground/60">(comma-separated)</span></label>
                      <input value={roleInputs.stackCsv ?? ""} onChange={(e) => setRoleField("stackCsv", e.target.value)} placeholder="Next.js, Node.js, Prisma, Postgres…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Chain expertise</label>
                      <input value={roleInputs.chainExpertiseCsv ?? ""} onChange={(e) => setRoleField("chainExpertiseCsv", e.target.value)} placeholder="Solana, Ethereum, Base…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Opportunity intent</label>
                      <input value={roleInputs.lookingForCsv ?? ""} onChange={(e) => setRoleField("lookingForCsv", e.target.value)} placeholder="Full-time, freelance, contract…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Links</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">GitHub</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        <input value={roleInputs.github ?? ""} onChange={(e) => setRoleField("github", e.target.value)} placeholder="https://github.com/username" className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Portfolio / website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input value={roleInputs.portfolioUrl ?? ""} onChange={(e) => setRoleField("portfolioUrl", e.target.value)} placeholder="https://yourportfolio.site" className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {workspace === "INVESTOR_OS" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Investor identity</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Investor type</label>
                      <select onChange={(e) => setRoleInputs((s) => ({ ...s, investorType: e.target.value }))} className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30">
                        <option value="">Select type…</option>
                        <option value="ANGEL">Angel investor</option>
                        <option value="VENTURE_FUND">Venture fund / VC</option>
                        <option value="SCOUT">Scout</option>
                        <option value="OPERATOR_INVESTOR">Operator investor</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Role / title</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, roleTitle: e.target.value }))} placeholder="General Partner, Scout, Angel" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Investment thesis</label>
                    <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, thesis: e.target.value }))} rows={3} placeholder="What do you invest in? Stage, sector, chain focus, and what you are optimistic about." className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Focus areas</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Stage focus</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, stageFocusCsv: e.target.value }))} placeholder="Pre-seed, Seed, Series A…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Chain focus</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, chainFocusCsv: e.target.value }))} placeholder="Ethereum, Solana, Base…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Sector focus</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, sectorFocusCsv: e.target.value }))} placeholder="DeFi, NFTs, Infrastructure…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Firm / fund <span className="normal-case font-normal text-muted-foreground/60">(optional)</span></p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Company / fund name</label>
                      <input onChange={(e) => setRoleInputs((s) => ({ ...s, companyName: e.target.value }))} placeholder="Paradigm, a16z, Independent" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Company description</label>
                      <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, companyDescription: e.target.value }))} rows={2} placeholder="Brief description of the fund or firm." className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Back
              </button>
              <button type="button" onClick={saveRoleSetup} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/15">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold">Integrations + Wallet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connect the tools you already use. You can always add or remove integrations later from your settings.</p>
            </div>

            {/* Integration Cards */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workspace integrations</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { id: "GMAIL", label: "Gmail", desc: "Connect inbox and draft from OS" },
                  { id: "GOOGLE_CALENDAR", label: "Google Calendar", desc: "Sync meetings and schedule" },
                  { id: "NOTION", label: "Notion", desc: "Bring wikis and docs to your OS" },
                  { id: "GITHUB", label: "GitHub", desc: "Proof-of-work and repo linking" },
                  { id: "JIRA", label: "Jira", desc: "Sync issues and project boards" },
                  { id: "CALENDLY", label: "Calendly", desc: "Booking links for intro calls" },
                  { id: "CAL_DOT_COM", label: "Cal.com", desc: "Open-source scheduling layer" },
                  { id: "FARCASTER", label: "Farcaster", desc: "Web3 social identity link" },
                ] as const).map(({ id, label, desc }) => {
                  const active = integrations.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleIntegration(id)}
                      className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-cyan-400/40 bg-cyan-400/8 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                          : "border-border/60 bg-background hover:border-border hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                        active ? "border-cyan-400/30 bg-cyan-400/10" : "border-border/60 bg-card"
                      }`}>
                        <IntegrationBrandIcon id={id} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${ active ? "text-cyan-200" : "text-foreground" }`}>{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <div className={`ml-auto flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                        active ? "border-cyan-400/60 bg-cyan-400" : "border-border"
                      }`}>
                        {active ? <svg className="h-3 w-3 text-black" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wallet Native Identity */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-cyan-300" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Wallet Native Identity</p>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Link a wallet to establish on-chain identity. Used for proof-of-ownership, token gating, and web3 reputation signals.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* MetaMask */}
                <button
                  type="button"
                  onClick={connectEvmWallet}
                  className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
                    walletAddress && walletNetwork === "EVM"
                      ? "border-orange-400/40 bg-orange-400/5 shadow-[0_0_0_1px_rgba(251,146,60,0.15)]"
                      : "border-border/60 bg-background hover:border-orange-400/30 hover:bg-orange-400/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-400/10">
                      <img
                        src="/integrations/metamask-fox.svg"
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        decoding="async"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">MetaMask</p>
                      <p className="text-xs text-muted-foreground">EVM — Ethereum & all EVM chains</p>
                    </div>
                    {walletAddress && walletNetwork === "EVM" ? (
                      <div className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected</div>
                    ) : null}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Connect your MetaMask wallet to verify EVM identity, enable token gating, and link on-chain history to your profile.
                  </p>
                  {walletAddress && walletNetwork === "EVM" ? (
                    <div className="flex items-center gap-1.5 rounded-lg bg-orange-400/5 px-3 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <p className="truncate font-mono text-[10px] text-emerald-300">{walletAddress}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-orange-300 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Click to connect MetaMask
                    </div>
                  )}
                </button>

                {/* Phantom / Solana */}
                <button
                  type="button"
                  onClick={connectSolanaWallet}
                  className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
                    walletAddress && walletNetwork === "SOLANA"
                      ? "border-purple-400/40 bg-purple-400/5 shadow-[0_0_0_1px_rgba(167,139,250,0.15)]"
                      : "border-border/60 bg-background hover:border-purple-400/30 hover:bg-purple-400/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-400/10">
                      <img
                        src="/integrations/phantom.svg"
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7"
                        decoding="async"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Phantom</p>
                      <p className="text-xs text-muted-foreground">Solana — SPL tokens & NFTs</p>
                    </div>
                    {walletAddress && walletNetwork === "SOLANA" ? (
                      <div className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected</div>
                    ) : null}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Connect Phantom to verify Solana identity, link NFT collections, and enable Solana-native proof-of-ownership across your profile.
                  </p>
                  {walletAddress && walletNetwork === "SOLANA" ? (
                    <div className="flex items-center gap-1.5 rounded-lg bg-purple-400/5 px-3 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <p className="truncate font-mono text-[10px] text-emerald-300">{walletAddress}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-purple-300 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Click to connect Phantom
                    </div>
                  )}
                </button>
              </div>

              {walletAddress ? (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400"  />
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{walletNetwork}</span> wallet connected</p>
                  </div>
                  <button type="button" onClick={saveWallet} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Save wallet
                  </button>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStep(3)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Back
              </button>
              <button type="button" onClick={saveIntegrations} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/15">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntegrations([]);
                  setStep(5);
                }}
                className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Skip for later
              </button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Preview & Publish</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the public-facing identity and workspace setup you are about to open. This is the first impression your profile creates across Webcoin Labs.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                <div className="h-32 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_28%),linear-gradient(135deg,rgba(10,15,18,1),rgba(17,20,27,1))]" />
                <div className="px-6 pb-6">
                  <div className="-mt-12 flex flex-col gap-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-[var(--bg-surface)] bg-background shadow-xl shadow-black/20">
                          {avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarPreview} alt={name || "Profile preview"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-3xl font-semibold text-cyan-200">
                              {(name || session?.user?.name || "U").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-3xl font-semibold tracking-tight text-foreground">{name || "Unnamed profile"}</h3>
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                              {workspaceDescriptor.title}
                            </span>
                            {walletAddress ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                                {walletNetwork} linked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-cyan-200">@{username || session?.user?.username || "username"}</p>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                            {bio || "Add a sharper bio if you want your public profile to tell people exactly what you build, invest in, or operate."}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Identity</p>
                          <p className="mt-2 text-sm font-medium text-foreground">{name && username ? "Ready" : "Needs work"}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Role setup</p>
                          <p className="mt-2 text-sm font-medium text-foreground">
                            {Object.values(roleInputs).some((value) => value?.trim()) ? "Configured" : "Partial"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Connectors</p>
                          <p className="mt-2 text-sm font-medium text-foreground">{integrations.length + (walletAddress ? 1 : 0)} linked</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                        <div className="flex items-center gap-2">
                          <workspaceDescriptor.icon className="h-4 w-4 text-cyan-300" />
                          <p className="font-semibold text-foreground">{workspaceDetails.title} profile summary</p>
                        </div>
                        {workspace === "BUILDER_OS" ? (
                          <div className="mt-4 space-y-4 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role title</p>
                              <p className="mt-1 font-medium text-foreground">{roleInputs.title || "Not added yet"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Professional summary</p>
                              <p className="mt-1 leading-6 text-muted-foreground">{roleInputs.builderDescription || "No builder summary added yet."}</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Skills</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(roleInputs.skillsCsv ? roleInputs.skillsCsv.split(",").map((item) => item.trim()).filter(Boolean) : ["No skills added"]).map((item) => (
                                    <span key={item} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{item}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stack</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(roleInputs.stackCsv ? roleInputs.stackCsv.split(",").map((item) => item.trim()).filter(Boolean) : ["No stack added"]).map((item) => (
                                    <span key={item} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{item}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Chain expertise</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.chainExpertiseCsv || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Opportunity intent</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.lookingForCsv || "Not specified"}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {workspace === "FOUNDER_OS" ? (
                          <div className="mt-4 space-y-4 text-sm">
                            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Company</p>
                                <p className="mt-1 font-medium text-foreground">{roleInputs.companyName || "Untitled venture"}</p>
                                <p className="mt-2 leading-6 text-muted-foreground">{roleInputs.companyDescription || "No company description added yet."}</p>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-card p-3">
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stage</p>
                                <p className="mt-1 font-medium text-foreground">{roleInputs.stage || "Not set"}</p>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Chain focus</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.chainFocus || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Looking for</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.lookingForCsv || "Not specified"}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Founder narrative</p>
                              <p className="mt-1 leading-6 text-muted-foreground">{roleInputs.founderDescription || "No founder narrative added yet."}</p>
                            </div>
                          </div>
                        ) : null}

                        {workspace === "INVESTOR_OS" ? (
                          <div className="mt-4 space-y-4 text-sm">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Investor type</p>
                                <p className="mt-1 font-medium text-foreground">{roleInputs.investorType || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role title</p>
                                <p className="mt-1 font-medium text-foreground">{roleInputs.roleTitle || "Not specified"}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Investment thesis</p>
                              <p className="mt-1 leading-6 text-muted-foreground">{roleInputs.thesis || "No thesis added yet."}</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stage focus</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.stageFocusCsv || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Chain focus</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.chainFocusCsv || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Sector focus</p>
                                <p className="mt-1 text-muted-foreground">{roleInputs.sectorFocusCsv || "Not specified"}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Links & identity</p>
                          <div className="mt-4 space-y-3 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Education / background</p>
                              <p className="mt-1 leading-6 text-muted-foreground">{educationBackground || "No background details added yet."}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2.5">
                                <span className="text-muted-foreground">X / Twitter</span>
                                <span className="max-w-[60%] truncate text-right text-foreground">{twitter || "Not linked"}</span>
                              </div>
                              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2.5">
                                <span className="text-muted-foreground">LinkedIn</span>
                                <span className="max-w-[60%] truncate text-right text-foreground">{linkedin || "Not linked"}</span>
                              </div>
                              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2.5">
                                <span className="text-muted-foreground">Website</span>
                                <span className="max-w-[60%] truncate text-right text-foreground">{website || "Not linked"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Connected systems</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {integrations.length > 0 ? integrations.map((provider) => (
                              <span key={provider} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                                {integrationLabels[provider as keyof typeof integrationLabels] ?? provider}
                              </span>
                            )) : (
                              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">No integrations selected</span>
                            )}
                            {walletAddress ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                                {walletNetwork} · {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                              </span>
                            ) : (
                              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">No wallet linked</span>
                            )}
                          </div>
                          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-300" />
                              <p className="font-semibold text-foreground">Ready to publish</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              Your initial {workspaceDescriptor.title} identity is configured. You can refine any profile section later from settings and role-specific profile pages.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Launch checklist</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Terms accepted", done: termsAccepted },
                      { label: "Workspace selected", done: Boolean(workspace) },
                      { label: "Identity completed", done: Boolean(name.trim() && username.trim()) },
                      { label: "Role setup saved", done: Object.values(roleInputs).some((value) => value?.trim()) },
                      { label: "Connectors reviewed", done: step >= 4 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-3 text-sm">
                        <span className="text-foreground">{item.label}</span>
                        <span className={item.done ? "text-emerald-300" : "text-amber-300"}>
                          {item.done ? "Done" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">What opens next</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    {workspaceDetails.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                router.push("/app");
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish & Open Dashboard
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
      </div>

      {step === 1 ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-cyan-300" />
                <p className="font-semibold text-foreground">{workspaceDetails.title} overview</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {workspaceDetails.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {workspaceDetails.features.map((feature) => (
                  <span key={feature} className="rounded-full border border-border px-2 py-1">
                    {feature}
                  </span>
                ))}
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                  <Coins className="mr-1 inline h-3 w-3" />
                  Premium quota aware
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="font-semibold text-foreground">Selection rules</p>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                <li>Your first workspace choice determines the onboarding path and initial dashboard you land in.</li>
                <li>Choose carefully: this primary workspace is locked after onboarding and is not meant to be switched casually later.</li>
                <li>You can still connect integrations, wallets, and profile data later, but the default role track should match how you primarily use Webcoin Labs.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

