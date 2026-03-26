import { existsSync, readFileSync } from "fs";
import path from "path";

type BuildManifest = {
  pages: Record<string, string[]>;
};

function bytesToKb(value: number) {
  return Number((value / 1024).toFixed(1));
}

function getAssetSize(absolutePath: string) {
  try {
    return readFileSync(absolutePath).byteLength;
  } catch {
    return 0;
  }
}

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(`[perf-budget] ${message}`);
  process.exit(1);
}

const nextRoot = path.join(process.cwd(), ".next");
const appManifestPath = path.join(nextRoot, "app-build-manifest.json");
if (!existsSync(appManifestPath)) {
  // eslint-disable-next-line no-console
  console.warn("[perf-budget] .next/app-build-manifest.json not found. Run `pnpm build` before this check.");
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(appManifestPath, "utf8")) as BuildManifest;
const appFiles = [
  ...(manifest.pages["/app/page"] ?? []),
  ...(manifest.pages["/app/layout"] ?? []),
  ...(manifest.pages["/app/notifications/page"] ?? []),
];
const uniqueFiles = Array.from(new Set(appFiles)).filter(Boolean);
const jsFiles = uniqueFiles.filter((item) => item.endsWith(".js"));
const totalBytes = jsFiles.reduce((sum, file) => sum + getAssetSize(path.join(nextRoot, file.replace(/^\//, ""))), 0);

const budgetKb = Number(process.env.PERF_BUDGET_APP_JS_KB ?? 900);
if (bytesToKb(totalBytes) > budgetKb) {
  fail(
    `App route JS budget exceeded. got=${bytesToKb(totalBytes)}KB budget=${budgetKb}KB files=${jsFiles.length}`
  );
}

// eslint-disable-next-line no-console
console.info(
  `[perf-budget] OK app-js=${bytesToKb(totalBytes)}KB budget=${budgetKb}KB files=${jsFiles.length}`
);
