import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = {
  visibilityRule: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("visibility policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("allows when no rules", async () => {
    prismaMock.visibilityRule.findMany.mockResolvedValue([]);
    const { canViewerAccessEntity } = await import("@/server/policies/visibility");
    await expect(canViewerAccessEntity("FOUNDER_PROFILE", "entity-1", {})).resolves.toBe(true);
  });

  test("blocks anonymous viewer for PRIVATE rule", async () => {
    prismaMock.visibilityRule.findMany.mockResolvedValue([
      { accessLevel: "PRIVATE", allowedUserId: null, appliesToRole: null },
    ]);
    const { canViewerAccessEntity } = await import("@/server/policies/visibility");
    await expect(canViewerAccessEntity("FOUNDER_PROFILE", "entity-1", {})).resolves.toBe(false);
  });

  test("allows explicitly allowed user for PRIVATE rule", async () => {
    prismaMock.visibilityRule.findMany.mockResolvedValue([
      { accessLevel: "PRIVATE", allowedUserId: "user-1", appliesToRole: null },
    ]);
    const { canViewerAccessEntity } = await import("@/server/policies/visibility");
    await expect(
      canViewerAccessEntity("FOUNDER_PROFILE", "entity-1", { userId: "user-1", role: "INVESTOR" }),
    ).resolves.toBe(true);
  });

  test("blocks non-admin for INTERNAL rule", async () => {
    prismaMock.visibilityRule.findMany.mockResolvedValue([
      { accessLevel: "INTERNAL", allowedUserId: null, appliesToRole: null },
    ]);
    const { canViewerAccessEntity } = await import("@/server/policies/visibility");
    await expect(
      canViewerAccessEntity("BUILDER_PROFILE", "entity-1", { role: "INVESTOR" }),
    ).resolves.toBe(false);
  });

  test("allows shared by appliesToRole", async () => {
    prismaMock.visibilityRule.findMany.mockResolvedValue([
      { accessLevel: "SHARED", allowedUserId: null, appliesToRole: "INVESTOR" },
    ]);
    const { canViewerAccessEntity } = await import("@/server/policies/visibility");
    await expect(
      canViewerAccessEntity("INVESTOR_PROFILE", "entity-1", { role: "INVESTOR" }),
    ).resolves.toBe(true);
  });
});
