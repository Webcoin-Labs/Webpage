import Link from "next/link";
import type { ComponentType } from "react";
import { CalendarClock, Github, Mail, NotepadText, Orbit, Radio, Wallet, Workflow } from "lucide-react";
import { hasIntegrationBrandIcon, IntegrationBrandIcon } from "@/components/integrations/IntegrationBrandIcon";

export type IntegrationCardStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "SYNCING";

export type IntegrationCardModel = {
  id: string;
  name: string;
  detail: string;
  status: IntegrationCardStatus;
  href: string;
  providerKey?: string;
  lastSyncedAt?: Date | null;
  lastError?: string | null;
  connectFormAction?: (formData: FormData) => void | Promise<void>;
  disconnectFormAction?: (formData: FormData) => void | Promise<void>;
  providerValue?: string;
};

const FALLBACK_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  GITHUB: Github,
  GMAIL: Mail,
  GOOGLE_CALENDAR: CalendarClock,
  NOTION: NotepadText,
  CALENDLY: CalendarClock,
  CAL_DOT_COM: CalendarClock,
  FARCASTER: Orbit,
  TELEGRAM: Radio,
  WALLET: Wallet,
  OPENCLOW: Workflow,
  OPENCLAW: Workflow,
};

function statusLabel(status: IntegrationCardStatus) {
  if (status === "CONNECTED") return "Connected";
  if (status === "SYNCING") return "Syncing";
  if (status === "ERROR") return "Action required";
  return "Disconnected";
}

function statusClass(status: IntegrationCardStatus) {
  if (status === "CONNECTED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "SYNCING") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  if (status === "ERROR") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-border/60 bg-background text-muted-foreground";
}

function renderIcon(providerKey?: string) {
  if (!providerKey) return null;
  const normalized = providerKey.toUpperCase();
  if (hasIntegrationBrandIcon(normalized)) {
    return <IntegrationBrandIcon id={normalized} className="h-5 w-5" />;
  }
  const Icon = FALLBACK_ICONS[normalized];
  if (!Icon) return null;
  return <Icon className="h-5 w-5 text-foreground" />;
}

export function IntegrationStatusCard({ card }: { card: IntegrationCardModel }) {
  const isConnected = card.status === "CONNECTED";
  const actionLabel = isConnected ? "Manage" : "Connect";
  const providerValue = card.providerValue ?? card.providerKey ?? card.id;
  const canSubmitAction = isConnected ? Boolean(card.disconnectFormAction) : Boolean(card.connectFormAction);
  const submitAction = isConnected ? card.disconnectFormAction : card.connectFormAction;

  return (
    <article className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80">
          {renderIcon(card.providerKey)}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(card.status)}`}>
          {statusLabel(card.status)}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold">{card.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
      {card.lastSyncedAt ? (
        <p className="mt-1 text-[11px] text-muted-foreground">Last sync: {card.lastSyncedAt.toLocaleString()}</p>
      ) : null}
      {card.lastError ? (
        <p className="mt-1 line-clamp-2 text-[11px] text-red-300">Last error: {card.lastError}</p>
      ) : null}
      <div className="mt-4">
        {canSubmitAction && submitAction ? (
          <form action={submitAction}>
            <input type="hidden" name="provider" value={providerValue} />
            <button
              type="submit"
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
                isConnected
                  ? "border-border text-muted-foreground hover:text-foreground"
                  : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              }`}
            >
              {isConnected ? "Disconnect" : actionLabel}
            </button>
          </form>
        ) : (
          <Link
            href={card.href}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
              isConnected
                ? "border-border text-muted-foreground hover:text-foreground"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
            }`}
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
