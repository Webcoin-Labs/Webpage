export type AffiliationTagVariant = "default" | "founder" | "independent" | "available";

type FounderLike = {
  companyName?: string | null;
};

type BuilderLike = {
  affiliation?: string | null;
  independent?: boolean | null;
  openToWork?: boolean | null;
};

export function getFounderAffiliation(founder?: FounderLike | null): { label: string; variant: AffiliationTagVariant } | null {
  const companyName = founder?.companyName?.trim();
  if (!companyName) return null;
  return { label: companyName, variant: "founder" };
}

export function getBuilderAffiliation(builder?: BuilderLike | null): { label: string; variant: AffiliationTagVariant } {
  const affiliation = builder?.affiliation?.trim();
  if (affiliation) return { label: affiliation, variant: "default" };
  if (builder?.independent) return { label: "Independent", variant: "independent" };
  if (builder?.openToWork) return { label: "Available", variant: "available" };
  return { label: "Builder", variant: "default" };
}
