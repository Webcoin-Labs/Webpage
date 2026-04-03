import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl, readTelegramFromSocialLinks } from "@/lib/contact-visibility";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const session = await getServerSession();
  if (!canViewerAccessInvestorOnlyContacts(session?.user?.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { username } = await params;

  const user = await db.user.findFirst({
    where: { username: username.toLowerCase() },
    include: {
      founderProfile: true,
      builderProfile: true,
      publicProfileSettings: true,
      profileLinksFrom: {
        include: {
          toUser: {
            select: {
              founderProfile: { select: { telegram: true } },
              publicProfileSettings: { select: { showTelegramToInvestors: true } },
            },
          },
        },
      },
    },
  });
  if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const linkedFounderTelegram = user.profileLinksFrom.find((link) => link.toUser.founderProfile?.telegram)?.toUser.founderProfile?.telegram;
  const visibleTelegram = user.publicProfileSettings?.showTelegramToInvestors ?? true;
  const visibleLinkedin = user.publicProfileSettings?.showLinkedinToInvestors ?? true;
  const visibleEmail = user.publicProfileSettings?.showEmailToInvestors ?? false;

  const telegram = visibleTelegram
    ? normalizeTelegramUrl(user.founderProfile?.telegram ?? linkedFounderTelegram ?? readTelegramFromSocialLinks(user.socialLinks))
    : null;
  const linkedin = visibleLinkedin ? user.founderProfile?.linkedin ?? user.builderProfile?.linkedin ?? null : null;
  const email = visibleEmail ? user.email : null;

  return NextResponse.json({
    success: true,
    contacts: {
      telegram,
      linkedin,
      email,
    },
  });
}
