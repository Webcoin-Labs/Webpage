import { beforeEach, describe, expect, test, vi } from "vitest";

const getServerSession = vi.fn();
const revalidatePath = vi.fn();
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
  investorApplication: {
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  adminAssignment: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog,
}));

describe("founder -> investor -> admin workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.premiumSubscription.findUnique.mockResolvedValue({ tier: "FREE" });
    prismaMock.founderInvestorRequestQuota.findUnique.mockResolvedValue({
      userId: "founder-1",
      cycleEnd: new Date(Date.now() + 86400000),
      limitCount: 3,
      sentCount: 0,
      tierSnapshot: "FREE",
    });
    prismaMock.venture.findFirst.mockResolvedValue({ id: "venture-1" });
    prismaMock.investorProfile.findUnique.mockResolvedValue({ userId: "investor-1" });
    prismaMock.investorApplication.create.mockResolvedValue({ id: "app-1" });
    prismaMock.investorApplication.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.founderInvestorRequestQuota.update.mockResolvedValue({
      userId: "founder-1",
      sentCount: 1,
    });

    prismaMock.adminAssignment.create.mockResolvedValue({ id: "assign-1", status: "OPEN" });
    prismaMock.adminAssignment.update.mockResolvedValue({ id: "assign-1", status: "IN_PROGRESS" });
  });

  test("tracks application and admin routing with audit logs", async () => {
    const { submitInvestorApplication, updateInvestorApplicationStatus } = await import("@/app/actions/webcoin-os");
    const { createAdminAssignment, updateAdminAssignmentStatus } = await import("@/server/services/canonical-graph.service");

    getServerSession.mockResolvedValueOnce({
      user: { id: "founder-1", role: "FOUNDER" },
    });

    const founderForm = new FormData();
    founderForm.set("ventureId", "venture-1");
    founderForm.set("investorUserId", "investor-1");
    founderForm.set("pitchDeckId", "deck-1");
    founderForm.set("note", "Founder intro note");

    const founderResult = await submitInvestorApplication(founderForm);
    expect(founderResult.success).toBe(true);
    expect(prismaMock.investorApplication.create).toHaveBeenCalledTimes(1);

    getServerSession.mockResolvedValueOnce({
      user: { id: "investor-1", role: "INVESTOR" },
    });

    const investorForm = new FormData();
    investorForm.set("applicationId", "app-1");
    investorForm.set("status", "REVIEWING");

    const investorResult = await updateInvestorApplicationStatus(investorForm);
    expect(investorResult.success).toBe(true);
    expect(prismaMock.investorApplication.updateMany).toHaveBeenCalledWith({
      where: { id: "app-1", investorUserId: "investor-1" },
      data: { status: "REVIEWING" },
    });

    await createAdminAssignment({
      createdByAdminId: "admin-1",
      type: "FOUNDER_TO_INVESTOR",
      founderUserId: "founder-1",
      investorUserId: "investor-1",
      ventureId: "venture-1",
      note: "Route founder to investor",
    });
    await updateAdminAssignmentStatus({
      assignmentId: "assign-1",
      status: "IN_PROGRESS",
      assigneeAdminId: "admin-1",
    });

    expect(prismaMock.adminAssignment.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.adminAssignment.update).toHaveBeenCalledTimes(1);

    const actions = writeAuditLog.mock.calls.map(([entry]) => entry.action);
    expect(actions).toContain("create_investor_application");
    expect(actions).toContain("update_investor_application_status");
    expect(actions).toContain("admin_create_assignment");
    expect(actions).toContain("admin_update_assignment_status");
    expect(revalidatePath).toHaveBeenCalled();
  });
});
