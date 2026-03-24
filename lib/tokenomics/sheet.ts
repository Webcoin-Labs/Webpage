import "server-only";

import { Workbook } from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";

export type TokenomicsSheetRow = {
  label: string;
  percentage?: number;
  tokenAmount?: number;
  cliffMonths?: number;
  vestingMonths?: number;
  unlockCadence?: string;
  notes?: string;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeRows(rows: Array<Record<string, unknown>>) {
  const normalized: TokenomicsSheetRow[] = rows
    .map((row) => ({
      label: String(row.label ?? row.allocation ?? "").trim(),
      percentage: toNumber(row.percentage),
      tokenAmount: toNumber(row.tokenamount ?? row.tokens),
      cliffMonths: toNumber(row.cliffmonths ?? row.cliff),
      vestingMonths: toNumber(row.vestingmonths ?? row.vesting),
      unlockCadence: String(row.unlockcadence ?? row.unlock ?? "").trim() || undefined,
      notes: String(row.notes ?? "").trim() || undefined,
    }))
    .filter((row) => row.label.length > 0);

  if (normalized.length === 0) {
    throw new Error("No valid allocation rows found. Include at least one row with a label.");
  }

  const percentageTotal = normalized.reduce((sum, row) => sum + (row.percentage ?? 0), 0);
  if (percentageTotal > 100.0001) {
    throw new Error("Allocation percentages exceed 100%.");
  }

  return { rows: normalized };
}

function parseFromCsv(buffer: Buffer) {
  const parsed = parseCsv(buffer, { columns: true, skip_empty_lines: true, trim: true }) as Array<Record<string, unknown>>;
  if (parsed.length === 0) throw new Error("No allocation rows found.");
  const normalizedRows = parsed.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [rawHeader, value] of Object.entries(row)) {
      normalized[mapHeader(rawHeader)] = value;
    }
    return normalized;
  });
  return normalizeRows(normalizedRows);
}

async function parseFromXlsx(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("No sheet found in workbook.");
  const headerCells = worksheet.getRow(1).values as Array<unknown>;
  const normalizedHeaders = headerCells.map((header) => mapHeader(header));
  const rows: Array<Record<string, unknown>> = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const cellValues = worksheet.getRow(rowNumber).values as Array<unknown>;
    const mapped: Record<string, unknown> = {};
    normalizedHeaders.forEach((header, idx) => {
      if (!header || idx === 0) return;
      mapped[header] = cellValues[idx];
    });
    rows.push(mapped);
  }
  if (rows.length === 0) throw new Error("No allocation rows found.");
  return normalizeRows(rows);
}

export async function parseTokenomicsWorkbook(buffer: Buffer, fileName?: string) {
  const lower = (fileName ?? "").toLowerCase();
  if (lower.endsWith(".csv")) return parseFromCsv(buffer);
  return parseFromXlsx(buffer);
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export async function buildTokenomicsWorkbook(rows: TokenomicsSheetRow[], format: "csv" | "xlsx") {
  const headers = ["label", "percentage", "tokenAmount", "cliffMonths", "vestingMonths", "unlockCadence", "notes"] as const;
  const dataRows = rows.map((row) => [
    row.label,
    row.percentage ?? "",
    row.tokenAmount ?? "",
    row.cliffMonths ?? "",
    row.vestingMonths ?? "",
    row.unlockCadence ?? "",
    row.notes ?? "",
  ]);
  if (format === "csv") {
    const csv = [headers.join(","), ...dataRows.map((row) => row.map(escapeCsv).join(","))].join("\n");
    return {
      mime: "text/csv",
      fileName: "tokenomics.csv",
      buffer: Buffer.from(csv, "utf-8"),
    };
  }

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Tokenomics");
  sheet.addRow(headers);
  dataRows.forEach((row) => sheet.addRow(row));
  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "tokenomics.xlsx",
    buffer: Buffer.from(xlsxBuffer),
  };
}
