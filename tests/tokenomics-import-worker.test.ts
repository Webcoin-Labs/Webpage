import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = {
  tokenomicsUpload: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  tokenomicsScenario: {
    findUnique: vi.fn(),
  },
  tokenomicsAllocationRow: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  tokenomicsScenarioRevision: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("tokenomics import worker route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_JOBS_SECRET = "job-secret";
  });

  test("returns 401 for unauthorized calls", async () => {
    const { POST } = await import("@/app/api/internal/jobs/tokenomics-import/route");
    const response = await POST(new Request("http://localhost/api/internal/jobs/tokenomics-import", { method: "POST" }));
    expect(response.status).toBe(401);
  });

  test("processes queued uploads and marks upload completed", async () => {
    prismaMock.tokenomicsUpload.findMany.mockResolvedValue([
      {
        id: "upload-1",
        uploadedById: "user-1",
        payloadJson: {
          scenarioId: "scenario-1",
          rows: [{ label: "Team", percentage: 20, tokenAmount: 1000 }],
        },
      },
    ]);
    prismaMock.tokenomicsUpload.update.mockResolvedValue({});
    prismaMock.tokenomicsScenario.findUnique.mockResolvedValue({ id: "scenario-1" });
    prismaMock.tokenomicsScenarioRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });
    prismaMock.tokenomicsScenarioRevision.create.mockResolvedValue({});
    prismaMock.tokenomicsAllocationRow.deleteMany.mockReturnValue({} as never);
    prismaMock.tokenomicsAllocationRow.create.mockReturnValue({} as never);
    prismaMock.$transaction.mockResolvedValue([]);

    const { POST } = await import("@/app/api/internal/jobs/tokenomics-import/route");
    const response = await POST(
      new Request("http://localhost/api/internal/jobs/tokenomics-import", {
        method: "POST",
        headers: { "x-webcoinlabs-job-secret": "job-secret" },
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(prismaMock.tokenomicsUpload.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "upload-1" }, data: { status: "COMPLETED" } }),
    );
  });
});
