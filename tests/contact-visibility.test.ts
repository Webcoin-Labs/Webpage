import { describe, expect, test } from "vitest";
import { canViewerAccessInvestorOnlyContacts, normalizeTelegramUrl, readTelegramFromSocialLinks } from "@/lib/contact-visibility";

describe("contact visibility", () => {
  test("allows only investor and admin roles for investor-only contacts", () => {
    expect(canViewerAccessInvestorOnlyContacts("INVESTOR")).toBe(true);
    expect(canViewerAccessInvestorOnlyContacts("ADMIN")).toBe(true);
    expect(canViewerAccessInvestorOnlyContacts("FOUNDER")).toBe(false);
    expect(canViewerAccessInvestorOnlyContacts("BUILDER")).toBe(false);
    expect(canViewerAccessInvestorOnlyContacts(undefined)).toBe(false);
  });

  test("normalizes telegram handles to URLs", () => {
    expect(normalizeTelegramUrl("@webcoinlabs")).toBe("https://t.me/webcoinlabs");
    expect(normalizeTelegramUrl("webcoinlabs")).toBe("https://t.me/webcoinlabs");
    expect(normalizeTelegramUrl("https://t.me/webcoinlabs")).toBe("https://t.me/webcoinlabs");
  });

  test("reads telegram from social links object", () => {
    expect(readTelegramFromSocialLinks({ telegram: "@webcoinlabs" })).toBe("@webcoinlabs");
    expect(readTelegramFromSocialLinks({ telegram: "" })).toBeNull();
    expect(readTelegramFromSocialLinks(null)).toBeNull();
  });
});
