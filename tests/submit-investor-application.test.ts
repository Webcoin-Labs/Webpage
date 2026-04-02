import { beforeEach, describe, expect, test, vi } from "vitest";

const getServerSession = vi.fn();
const writeAuditLog = vi.fn();
const prismaMock = {
  premiumSubscription: { findUnique: vi.fn() },
  founderInvestorRequestQuota: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  venture: { findFirst: vi.fn() },
  investorProfile: { findUnique: vi.fn() },
  investorApplication: { create: vi.fn() },
};

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getServerSession,
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog,
}));

describe("submitInvestorApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({
      user: {
        id: "founder-1",
        role: "FOUNDER",
      },
    });
  });

  test("blocks submission when monthly quota is reached", async () => {
    prismaMock.premiumSubscription.findUnique.mockResolvedValue({ tier: "FREE" });
    prismaMock.founderInvestorRequestQuota.findUnique.mockResolvedValue({
      userId: "founder-1",
      cycleEnd: new Date(Date.now() + 86400000),
      limitCount: 3,
      sentCount: 3,
      tierSnapshot: "FREE",
    });
    prismaMock.venture.findFirst.mockResolvedValue({ id: "venture-1" });
    prismaMock.investorProfile.findUnique.mockResolvedValue({ userId: "investor-1" });

    const { submitInvestorApplication } = await import("@/app/actions/webcoin-os");
    const formData = new FormData();
    formData.set("ventureId", "venture-1");
    formData.set("investorUserId", "investor-1");
    formData.set("pitchDeckId", "deck-1");
    formData.set("note", "please review");

    const result = await submitInvestorApplication(formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("quota");
    }
    expect(prismaMock.investorApplication.create).not.toHaveBeenCalled();
    expect(writeAuditLog).not.toHaveBeenCalled();
  });
});
