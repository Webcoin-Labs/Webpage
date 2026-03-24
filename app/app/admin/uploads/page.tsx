import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadAssetType, UploadModerationStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { AdminUploadModerationTable } from "@/components/app/AdminUploadModerationTable";
import {
  upsertAvatarUploadAsset,
  upsertFounderLogoUploadAsset,
  upsertPitchDeckUploadAsset,
} from "@/lib/uploads/assets";

export const metadata = { title: "Uploads Moderation - Admin | Webcoin Labs" };

type SearchParams = {
  type?: string;
  status?: string;
  q?: string;
};

const typeOptions: UploadAssetType[] = ["AVATAR", "COMPANY_LOGO", "PITCH_DECK", "OTHER"];
const statusOptions: UploadModerationStatus[] = ["ACTIVE", "FLAGGED", "QUARANTINED", "REMOVED", "FAILED", "REPROCESSING"];

async function backfillUploadAssets() {
  const [users, founders, decks] = await Promise.all([
    db.user.findMany({
      where: {
        image: { not: null },
        avatarUploadAsset: { is: null },
      },
      select: {
        id: true,
        image: true,
        imageStorageKey: true,
        imageMimeType: true,
        imageSize: true,
        imageWidth: true,
        imageHeight: true,
        imageOriginalName: true,
      },
      take: 500,
    }),
    db.founderProfile.findMany({
      where: {
        companyLogoUrl: { not: null },
        logoUploadAsset: { is: null },
      },
      select: {
        id: true,
        userId: true,
        companyLogoUrl: true,
        companyLogoStorageKey: true,
        companyLogoMimeType: true,
        companyLogoSize: true,
        companyLogoWidth: true,
        companyLogoHeight: true,
        companyLogoOriginalName: true,
      },
      take: 500,
    }),
    db.pitchDeck.findMany({
      where: {
        fileUrl: { not: "" },
        uploadAsset: { is: null },
      },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
        storageKey: true,
        fileType: true,
        fileSize: true,
        originalFileName: true,
      },
      take: 500,
    }),
  ]);

  for (const user of users) {
    if (!user.image) continue;
    await upsertAvatarUploadAsset(user.id, {
      ownerUserId: user.id,
      fileUrl: user.image,
      storageKey: user.imageStorageKey ?? null,
      mimeType: user.imageMimeType ?? null,
      fileSize: user.imageSize ?? null,
      width: user.imageWidth ?? null,
      height: user.imageHeight ?? null,
      originalName: user.imageOriginalName ?? null,
    });
  }
  for (const founder of founders) {
    if (!founder.companyLogoUrl) continue;
    await upsertFounderLogoUploadAsset(founder.id, {
      ownerUserId: founder.userId,
      fileUrl: founder.companyLogoUrl,
      storageKey: founder.companyLogoStorageKey ?? null,
      mimeType: founder.companyLogoMimeType ?? null,
      fileSize: founder.companyLogoSize ?? null,
      width: founder.companyLogoWidth ?? null,
      height: founder.companyLogoHeight ?? null,
      originalName: founder.companyLogoOriginalName ?? null,
    });
  }
  for (const deck of decks) {
    await upsertPitchDeckUploadAsset(deck.id, {
      ownerUserId: deck.userId,
      fileUrl: deck.fileUrl,
      storageKey: deck.storageKey ?? null,
      mimeType: deck.fileType,
      fileSize: deck.fileSize,
      originalName: deck.originalFileName,
    });
  }
}

function parseFilterValue<T extends string>(value: string | undefined, options: readonly T[]) {
  if (!value) return undefined;
  return (options as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function AdminUploadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  await backfillUploadAssets();

  const selectedType = parseFilterValue(resolvedSearchParams.type, typeOptions);
  const selectedStatus = parseFilterValue(resolvedSearchParams.status, statusOptions);
  const searchQuery = resolvedSearchParams.q?.trim() ?? "";

  const where = {
    ...(selectedType ? { assetType: selectedType } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(searchQuery
      ? {
          OR: [
            { originalName: { contains: searchQuery, mode: "insensitive" as const } },
            { fileUrl: { contains: searchQuery, mode: "insensitive" as const } },
            { storageKey: { contains: searchQuery, mode: "insensitive" as const } },
            { ownerUser: { name: { contains: searchQuery, mode: "insensitive" as const } } },
            { ownerUser: { email: { contains: searchQuery, mode: "insensitive" as const } } },
            { founderProfile: { companyName: { contains: searchQuery, mode: "insensitive" as const } } },
            { pitchDeck: { originalFileName: { contains: searchQuery, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.uploadAsset.findMany({
      where,
      include: {
        ownerUser: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true } },
        founderProfile: {
          select: {
            id: true,
            companyName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        pitchDeck: {
          select: {
            id: true,
            originalFileName: true,
            uploadStatus: true,
            processingStatus: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            actedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
    }),
    db.uploadAsset.count({ where }),
  ]);

  return (
    <div className="space-y-6 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Upload Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review, quarantine, remove, restore, and reprocess uploaded assets across avatars, company logos, and pitch decks.
        </p>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-card p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={searchQuery}
          placeholder="Search owner, file, company..."
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <select name="type" defaultValue={selectedType ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">All asset types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={selectedStatus ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500/90">
            Apply Filters
          </button>
          <Link
            href="/app/admin/uploads"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-xs text-muted-foreground">
        Showing {items.length} of {total} assets.
      </div>

      <AdminUploadModerationTable items={items} />
    </div>
  );
}
