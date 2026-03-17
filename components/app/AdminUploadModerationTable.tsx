"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  History,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type {
  UploadAssetType,
  UploadModerationAction,
  UploadModerationStatus,
} from "@prisma/client";
import {
  bulkModerateUploadAssets,
  flagUploadAsset,
  quarantineUploadAsset,
  removeUploadAsset,
  reprocessUploadAsset,
  restoreUploadAsset,
} from "@/app/actions/uploadModeration";

type Actor = { id: string; name: string | null; email: string | null };
type Item = {
  id: string;
  assetType: UploadAssetType;
  status: UploadModerationStatus;
  fileUrl: string;
  storageKey: string | null;
  mimeType: string | null;
  fileSize: number | null;
  originalName: string | null;
  moderationReason: string | null;
  moderationNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerUser: Actor | null;
  user: Actor | null;
  founderProfile: {
    id: string;
    companyName: string | null;
    user: Actor | null;
  } | null;
  pitchDeck: {
    id: string;
    originalFileName: string;
    uploadStatus: string;
    processingStatus: string;
  } | null;
  logs: Array<{
    id: string;
    action: UploadModerationAction;
    fromStatus: UploadModerationStatus | null;
    toStatus: UploadModerationStatus | null;
    reason: string | null;
    note: string | null;
    createdAt: Date;
    actedByUser: Actor | null;
  }>;
};

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function targetLabel(item: Item) {
  if (item.assetType === "AVATAR" && item.user) {
    return `Avatar: ${item.user.name ?? item.user.email ?? item.user.id}`;
  }
  if (item.assetType === "COMPANY_LOGO" && item.founderProfile) {
    return `Logo: ${item.founderProfile.companyName ?? item.founderProfile.id}`;
  }
  if (item.assetType === "PITCH_DECK" && item.pitchDeck) {
    return `Deck: ${item.pitchDeck.originalFileName}`;
  }
  return item.originalName ?? item.id;
}

function statusClass(status: UploadModerationStatus) {
  if (status === "ACTIVE") return "text-emerald-400";
  if (status === "FLAGGED") return "text-amber-400";
  if (status === "REPROCESSING") return "text-cyan-400";
  if (status === "FAILED") return "text-rose-400";
  if (status === "QUARANTINED") return "text-orange-400";
  return "text-muted-foreground";
}

export function AdminUploadModerationTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bulkPending, startBulkTransition] = useTransition();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const activeTimeline = useMemo(
    () => items.find((item) => item.id === activeTimelineId) ?? null,
    [items, activeTimelineId]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function selectAllVisible() {
    setSelectedIds(items.map((item) => item.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function runRowAction(id: string, action: "flag" | "quarantine" | "restore" | "reprocess" | "remove") {
    setMessage(null);
    setRowLoadingId(id);
    try {
      const result =
        action === "flag"
          ? await flagUploadAsset(id, "Flagged by admin moderation.")
          : action === "quarantine"
          ? await quarantineUploadAsset(id, "Quarantined by admin moderation.")
          : action === "restore"
          ? await restoreUploadAsset(id)
          : action === "reprocess"
          ? await reprocessUploadAsset(id)
          : await removeUploadAsset(id, "REMOVE", { reason: "Removed by admin moderation.", deleteFromStorage: false });

      setMessage(
        result.success
          ? `Asset ${id.slice(0, 8)} updated.`
          : `Action failed for ${id.slice(0, 8)}: ${result.error}`
      );
      router.refresh();
    } finally {
      setRowLoadingId(null);
    }
  }

  async function runBulk(operation: "FLAG" | "QUARANTINE" | "RESTORE" | "REMOVE" | "REPROCESS") {
    if (selectedIds.length === 0) {
      setMessage("Select at least one upload asset.");
      return;
    }
    setMessage(null);
    startBulkTransition(async () => {
      const result = await bulkModerateUploadAssets({
        assetIds: selectedIds,
        operation,
        deleteFromStorage: false,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      const failedCount = result.failed.length;
      setMessage(
        failedCount > 0
          ? `Processed ${result.processed} assets, ${failedCount} failed.`
          : `Processed ${result.processed} assets successfully.`
      );
      clearSelection();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={selectAllVisible} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
            Select all
          </button>
          <button type="button" onClick={clearSelection} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
            Clear
          </button>
          <button type="button" disabled={bulkPending} onClick={() => runBulk("FLAG")} className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">
            Flag selected
          </button>
          <button type="button" disabled={bulkPending} onClick={() => runBulk("QUARANTINE")} className="rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 hover:bg-orange-500/20 disabled:opacity-50">
            Quarantine selected
          </button>
          <button type="button" disabled={bulkPending} onClick={() => runBulk("RESTORE")} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">
            Restore selected
          </button>
          <button type="button" disabled={bulkPending} onClick={() => runBulk("REPROCESS")} className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
            Reprocess selected
          </button>
          <button type="button" disabled={bulkPending} onClick={() => runBulk("REMOVE")} className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 disabled:opacity-50">
            Remove selected
          </button>
          <div className="ml-auto text-xs text-muted-foreground">
            {bulkPending ? "Applying bulk action..." : `${selectedIds.length} selected`}
          </div>
        </div>
        {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Select</th>
              <th className="px-3 py-2 text-left">Asset</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Size</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const rowPending = rowLoadingId === item.id;
              return (
                <tr key={item.id} className="border-t border-border/40">
                  <td className="px-3 py-2">
                    <input
                      aria-label={`Select asset ${item.id}`}
                      type="checkbox"
                      checked={selectedSet.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-4 w-4 rounded border-border bg-background"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{targetLabel(item)}</div>
                    <div className="text-xs text-muted-foreground">{item.originalName ?? item.fileUrl}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.assetType}</td>
                  <td className="px-3 py-2">
                    <span className={statusClass(item.status)}>{item.status}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatBytes(item.fileSize)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setActiveTimelineId(item.id)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground" title="Timeline">
                        <History className="h-4 w-4" />
                      </button>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground" title="Open file">
                        <Eye className="h-4 w-4" />
                      </a>
                      <button type="button" disabled={rowPending} onClick={() => runRowAction(item.id, "flag")} className="rounded-md p-2 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50" title="Flag">
                        {rowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                      </button>
                      <button type="button" disabled={rowPending} onClick={() => runRowAction(item.id, "quarantine")} className="rounded-md p-2 text-orange-300 hover:bg-orange-500/10 disabled:opacity-50" title="Quarantine">
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={rowPending} onClick={() => runRowAction(item.id, "restore")} className="rounded-md p-2 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50" title="Restore">
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={rowPending} onClick={() => runRowAction(item.id, "reprocess")} className="rounded-md p-2 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50" title="Reprocess">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={rowPending} onClick={() => runRowAction(item.id, "remove")} className="rounded-md p-2 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeTimeline ? (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Moderation Timeline</h3>
            <button type="button" onClick={() => setActiveTimelineId(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{targetLabel(activeTimeline)}</p>
          <div className="space-y-3">
            {activeTimeline.logs.length === 0 ? (
              <div className="rounded-lg border border-border/40 bg-background p-3 text-xs text-muted-foreground">
                No moderation history yet.
              </div>
            ) : (
              activeTimeline.logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border/40 bg-background p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">
                      {log.fromStatus ?? "-"} to {log.toStatus ?? "-"}
                    </span>
                    <span className="ml-auto text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {log.reason ? <p className="mt-1 text-muted-foreground">Reason: {log.reason}</p> : null}
                  {log.note ? <p className="mt-1 text-muted-foreground">Note: {log.note}</p> : null}
                  {log.actedByUser ? (
                    <p className="mt-1 text-muted-foreground">
                      By: {log.actedByUser.name ?? log.actedByUser.email ?? log.actedByUser.id}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
