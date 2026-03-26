"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Briefcase, Building2, CheckCircle2, Coins, Loader2, Rocket, UserRound, Wallet } from "lucide-react";
import {
  completeWorkspaceOnboarding,
  saveOnboardingIntegrations,
  saveProfileIdentity,
  saveWalletConnection,
} from "@/app/actions/webcoin-os";

type WorkspaceChoice = "FOUNDER_OS" | "BUILDER_OS" | "INVESTOR_OS";

const stepLabels = ["Workspace", "Identity", "Role Setup", "Integrations", "Preview"];

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
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [workspace, setWorkspace] = useState<WorkspaceChoice>("FOUNDER_OS");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [educationBackground, setEducationBackground] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [roleInputs, setRoleInputs] = useState<Record<string, string>>({});
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState<"EVM" | "SOLANA">("EVM");
  const usernameLocked = Boolean(session?.user?.username);

  useEffect(() => {
    if (!session?.user) return;
    if (!name && session.user.name) setName(session.user.name);
    if (!username && session.user.username) setUsername(session.user.username);
  }, [session, name, username]);

  const workspaceDescriptor = useMemo(() => {
    if (workspace === "FOUNDER_OS") return { title: "Founder OS", icon: Rocket, copy: "Venture building, deck, investor outreach, builder discovery." };
    if (workspace === "INVESTOR_OS") return { title: "Investor OS", icon: Building2, copy: "Deal-flow, thesis, founder applications, and scheduling." };
    return { title: "Builder OS", icon: Briefcase, copy: "Proof-of-work profile, projects, GitHub, resume, and opportunity intent." };
  }, [workspace]);

  const toggleIntegration = (provider: string) => {
    setIntegrations((prev) => (prev.includes(provider) ? prev.filter((item) => item !== provider) : [...prev, provider]));
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
      const result = await saveProfileIdentity(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep(2);
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
      setStep(3);
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
      setStep(4);
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

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {stepLabels.map((label, index) => (
            <StepBadge key={label} value={`${index + 1}. ${label}`} active={index === step} />
          ))}
        </div>

        {step === 0 ? (
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
              onClick={() => {
                const hasIdentity = (name.trim().length >= 2) && (username.trim().length >= 3);
                setStep(hasIdentity ? 2 : 1);
              }}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
            >
              Continue
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Identity Setup</h2>
            <p className="text-sm text-muted-foreground">Name * and unique username * are required. Other fields are optional.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Name *</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Unique username *</p>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={usernameLocked}
                  readOnly={usernameLocked}
                />
              </div>
            </div>
            {usernameLocked ? <p className="text-xs text-muted-foreground">Username is locked once created.</p> : null}
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio / profile description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea
              value={educationBackground}
              onChange={(e) => setEducationBackground(e.target.value)}
              rows={2}
              placeholder="Education background"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X / Twitter" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn URL" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(0)} className="rounded-lg border border-border px-3 py-2 text-xs">
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

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <workspaceDescriptor.icon className="h-4 w-4 text-cyan-300" />
              <h2 className="text-xl font-semibold">{workspaceDescriptor.title} Setup</h2>
            </div>
            <p className="text-sm text-muted-foreground">{workspaceDescriptor.copy}</p>
            {workspace === "FOUNDER_OS" ? (
              <>
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, companyName: e.target.value }))} placeholder="Startup / company name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, companyDescription: e.target.value }))} rows={3} placeholder="Company description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, chainFocus: e.target.value }))} placeholder="Chain / ecosystem focus" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, stage: e.target.value }))} placeholder="Stage (idea/mvp/growth)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, lookingForCsv: e.target.value }))} placeholder="Looking for (developers, investors, cofounder, partners)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, founderDescription: e.target.value }))} rows={2} placeholder="Founder description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </>
            ) : null}
            {workspace === "BUILDER_OS" ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, title: e.target.value }))} placeholder="Role title" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, availability: e.target.value }))} placeholder="Availability" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, builderDescription: e.target.value }))} rows={2} placeholder="Builder description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, skillsCsv: e.target.value }))} placeholder="Skills (comma separated)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, stackCsv: e.target.value }))} placeholder="Stack (comma separated)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, chainExpertiseCsv: e.target.value }))} placeholder="Chain expertise (comma separated)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, lookingForCsv: e.target.value }))} placeholder="Opportunity intent (internship/full-time/freelance/...)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </>
            ) : null}
            {workspace === "INVESTOR_OS" ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <select onChange={(e) => setRoleInputs((s) => ({ ...s, investorType: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="">Investor type</option>
                    <option value="ANGEL">Angel investor</option>
                    <option value="VENTURE_FUND">Venture fund / VC</option>
                    <option value="SCOUT">Scout</option>
                    <option value="OPERATOR_INVESTOR">Operator investor</option>
                  </select>
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, roleTitle: e.target.value }))} placeholder="Role / title" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, thesis: e.target.value }))} rows={2} placeholder="Investment thesis" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, stageFocusCsv: e.target.value }))} placeholder="Stage focus" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <input onChange={(e) => setRoleInputs((s) => ({ ...s, chainFocusCsv: e.target.value }))} placeholder="Chain focus" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, sectorFocusCsv: e.target.value }))} placeholder="Sector focus" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input onChange={(e) => setRoleInputs((s) => ({ ...s, companyName: e.target.value }))} placeholder="Company / fund name (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea onChange={(e) => setRoleInputs((s) => ({ ...s, companyDescription: e.target.value }))} rows={2} placeholder="Company description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </>
            ) : null}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Back
              </button>
              <button type="button" onClick={saveRoleSetup} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Integrations + Wallet</h2>
            <p className="text-sm text-muted-foreground">Connect integrations relevant to your workspace and add wallet identity.</p>
            <div className="grid gap-2 md:grid-cols-2">
              {integrationOptions.map((provider) => (
                <label key={provider} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  <span>{provider.replaceAll("_", " ")}</span>
                  <input
                    type="checkbox"
                    checked={integrations.includes(provider)}
                    onChange={() => toggleIntegration(provider)}
                    className="accent-cyan-500"
                  />
                </label>
              ))}
            </div>

            <div className="rounded-lg border border-border/60 bg-background p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-cyan-300" /> Wallet Native Identity
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={connectEvmWallet} className="rounded-md border border-border px-3 py-1.5 text-xs">
                  Connect EVM Wallet
                </button>
                <button type="button" onClick={connectSolanaWallet} className="rounded-md border border-border px-3 py-1.5 text-xs">
                  Connect Solana Wallet
                </button>
                <button type="button" onClick={saveWallet} className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                  Save Wallet
                </button>
              </div>
              {walletAddress ? <p className="mt-2 text-xs text-muted-foreground">{walletNetwork}: {walletAddress}</p> : null}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-border px-3 py-2 text-xs">
                Back
              </button>
              <button type="button" onClick={saveIntegrations} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview & Publish</h2>
            <div className="rounded-lg border border-border/60 bg-background p-4 text-sm">
              <p className="font-semibold">{name || "Unnamed profile"}</p>
              <p className="text-xs text-muted-foreground">@{username || session?.user?.username || "username"}</p>
              <p className="mt-2 text-xs text-muted-foreground">{bio || "No bio added yet."}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <span className="rounded-full border border-border px-2 py-1">{workspaceDescriptor.title}</span>
                {integrations.map((provider) => (
                  <span key={provider} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                    {provider}
                  </span>
                ))}
                {walletAddress ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                    {walletNetwork} linked
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (workspace === "FOUNDER_OS") {
                  router.push("/app/founder-os");
                  return;
                }
                if (workspace === "INVESTOR_OS") {
                  router.push("/app/investor-os");
                  return;
                }
                router.push("/app/builder-os");
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

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Web3 Native Coverage</p>
        <p className="mt-1">EVM + Solana wallet support, mini-app-ready architecture (Base/Farcaster), integration connectors, and role-aware public identity routing.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-border px-2 py-1">/founder/[username]</span>
          <span className="rounded-full border border-border px-2 py-1">/builder/[username]</span>
          <span className="rounded-full border border-border px-2 py-1">/investor/[username]</span>
          <span className="rounded-full border border-border px-2 py-1">/investor/[company-slug]/[username]</span>
          <span className="rounded-full border border-border px-2 py-1">/investor/[company-slug]</span>
          <span className="rounded-full border border-border px-2 py-1">
            <Coins className="mr-1 inline h-3 w-3 text-cyan-300" />
            Premium quota aware
          </span>
        </div>
      </div>
    </div>
  );
}
