import { beforeEach, describe, expect, test, vi } from "vitest";

const getServerSession = vi.fn();
const prismaMock = {
  userWorkspace: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/auth", () => ({
  getServerSession,
  authOptions: {},
}));

vi.mock("@/server/db/client", () => ({
  db: prismaMock,
}));

describe("authz policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("allows admin regardless of allowed role list", async () => {
    const { assertAnyRole } = await import("@/server/policies/authz");
    expect(() =>
      assertAnyRole(
        { id: "admin-1", role: "ADMIN" },
        ["FOUNDER"],
      ),
    ).not.toThrow();
  });

  test("throws unauthorized for disallowed role", async () => {
    const { assertAnyRole, AuthzError } = await import("@/server/policies/authz");
    expect(() =>
      assertAnyRole(
        { id: "builder-1", role: "BUILDER" },
        ["FOUNDER"],
      ),
    ).toThrow(AuthzError);
  });

  test("requireSessionUser throws 401 when session missing", async () => {
    const { requireSessionUser, AuthzError } = await import("@/server/policies/authz");
    getServerSession.mockResolvedValue(null);
    await expect(requireSessionUser()).rejects.toBeInstanceOf(AuthzError);
  });

  test("assertWorkspaceEnabled rejects disabled workspace", async () => {
    const { assertWorkspaceEnabled, AuthzError } = await import("@/server/policies/authz");
    prismaMock.userWorkspace.findUnique.mockResolvedValue({ status: "DISABLED" });
    await expect(assertWorkspaceEnabled("u1", "FOUNDER_OS")).rejects.toBeInstanceOf(AuthzError);
  });

  test("getEnabledWorkspaces returns enabled entries", async () => {
    const { getEnabledWorkspaces } = await import("@/server/policies/authz");
    prismaMock.userWorkspace.findMany.mockResolvedValue([{ workspace: "FOUNDER_OS" }, { workspace: "BUILDER_OS" }]);
    await expect(getEnabledWorkspaces("u1")).resolves.toEqual(["FOUNDER_OS", "BUILDER_OS"]);
  });
});
