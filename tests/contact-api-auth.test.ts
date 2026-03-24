import { beforeEach, describe, expect, test, vi } from "vitest";

const getServerSession = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("contact API auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("rejects non-investor/non-admin role", async () => {
    getServerSession.mockResolvedValue({ user: { role: "FOUNDER" } });
    const { GET } = await import("@/app/api/profiles/contact/[username]/route");
    const response = await GET(new Request("http://localhost/api/profiles/contact/someone"), {
      params: Promise.resolve({ username: "someone" }),
    });
    expect(response.status).toBe(401);
  });
});
