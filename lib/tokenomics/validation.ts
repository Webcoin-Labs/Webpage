import "server-only";

export type TokenomicsRowInput = {
  label: string;
  percentage?: number;
  tokenAmount?: number;
  cliffMonths?: number;
  vestingMonths?: number;
  unlockCadence?: string;
  notes?: string;
};

export function validateTokenomicsRows(rows: TokenomicsRowInput[]) {
  const issues: string[] = [];
  let totalPct = 0;

  rows.forEach((row, idx) => {
    const i = idx + 1;
    if (!row.label?.trim()) issues.push(`Row ${i}: label is required.`);
    if (row.percentage !== undefined && row.percentage < 0) issues.push(`Row ${i}: percentage cannot be negative.`);
    if (row.percentage !== undefined && row.percentage > 100) issues.push(`Row ${i}: percentage cannot exceed 100.`);
    if (row.tokenAmount !== undefined && row.tokenAmount < 0) issues.push(`Row ${i}: token amount cannot be negative.`);
    if (row.cliffMonths !== undefined && row.cliffMonths < 0) issues.push(`Row ${i}: cliff months cannot be negative.`);
    if (row.vestingMonths !== undefined && row.vestingMonths < 0) issues.push(`Row ${i}: vesting months cannot be negative.`);
    if (
      row.cliffMonths !== undefined &&
      row.vestingMonths !== undefined &&
      row.vestingMonths > 0 &&
      row.cliffMonths > row.vestingMonths
    ) {
      issues.push(`Row ${i}: cliff cannot exceed vesting duration.`);
    }
    totalPct += row.percentage ?? 0;
  });

  if (totalPct > 100.0001) issues.push("Total allocation percentage exceeds 100%.");

  return {
    valid: issues.length === 0,
    issues,
    totalPercentage: totalPct,
  };
}
