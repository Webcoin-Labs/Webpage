import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { getFileStorage } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pitchDeckId: string }> },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { pitchDeckId } = await params;
  const deck = await db.pitchDeck.findUnique({
    where: { id: pitchDeckId },
    select: {
      id: true,
      userId: true,
      originalFileName: true,
      fileType: true,
      storageKey: true,
      uploadAsset: {
        select: {
          status: true,
        },
      },
    },
  });
  if (!deck?.storageKey) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && deck.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (deck.uploadAsset && ["REMOVED", "QUARANTINED", "FAILED"].includes(deck.uploadAsset.status)) {
    return NextResponse.json({ success: false, error: "Asset unavailable" }, { status: 410 });
  }

  const storage = getFileStorage();
  const buffer = await storage.getBuffer(deck.storageKey);
  const contentType = deck.fileType || "application/octet-stream";
  const safeFileName = (deck.originalFileName || "pitch-deck")
    .replace(/[\r\n"]/g, "")
    .slice(0, 180);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${safeFileName}"`,
    },
  });
}
