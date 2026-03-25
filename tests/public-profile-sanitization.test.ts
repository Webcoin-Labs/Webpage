import { beforeEach, describe, expect, test, vi } from "vitest";

const founderProfileMock = {
  id: "user-founder-1",
  username: "founder1",
  email: "founder1@webcoinlabs.test",
  socialLinks: { telegram: "@founder1" },
  publicProfileSettings: {
    showEmailToInvestors: false,
    showLinkedinToInvestors: true,
    showTelegramToInvestors: true,
  },
  founderProfile: {
    id: "fp-1",
    linkedin: "https://linkedin.com/in/founder1",
    telegram: "@founder1",
  },
};

const builderProfileMock = {
  id: "user-builder-1",
  username: "builder1",
  email: "builder1@webcoinlabs.test",
  socialLinks: { telegram: "@builder1" },
  publicProfileSettings: {
    showEmailToInvestors: true,
    showLinkedinToInvestors: false,
    showTelegramToInvestors: false,
  },
  builderProfile: {
    id: "bp-1",
    linkedin: "https://linkedin.com/in/builder1",
  },
};

vi.mock("@/server/selectors/public-profile.selectors", () => ({
  selectFounderPublicProfile: vi.fn(async () => founderProfileMock),
  selectBuilderPublicProfile: vi.fn(async () => builderProfileMock),
}));

describe("public profile sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("anonymous founder viewer does not receive email/linkedin/telegram", async () => {
    const { getFounderPublicProfile } = await import("@/lib/public-profiles");
    const profile = await getFounderPublicProfile("founder1", {});
    expect(profile?.email).toBeNull();
    expect(profile?.founderProfile?.linkedin).toBeNull();
    expect(profile?.founderProfile?.telegram).toBeNull();
  });

  test("investor founder viewer only receives enabled contact channels", async () => {
    const { getFounderPublicProfile } = await import("@/lib/public-profiles");
    const profile = await getFounderPublicProfile("founder1", { role: "INVESTOR" });
    expect(profile?.email).toBeNull();
    expect(profile?.founderProfile?.linkedin).toBe("https://linkedin.com/in/founder1");
    expect(profile?.founderProfile?.telegram).toBe("@founder1");
  });

  test("investor builder viewer only receives enabled contact channels", async () => {
    const { getBuilderPublicProfile } = await import("@/lib/public-profiles");
    const profile = await getBuilderPublicProfile("builder1", { role: "INVESTOR" });
    expect(profile?.email).toBe("builder1@webcoinlabs.test");
    expect(profile?.builderProfile?.linkedin).toBeNull();
  });
});

