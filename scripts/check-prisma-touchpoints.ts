import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const includeRoots = ["app", "components", "features", "lib", "server"];
const fileExtensions = new Set([".ts", ".tsx"]);
const allowedPaths = [
  "lib/prisma.ts",
  "server/services/",
  "server/selectors/",
  "server/policies/",
  "server/db/",
  "scripts/",
  "tests/",
];

type Finding = {
  file: string;
  line: number;
  text: string;
};

function shouldInclude(filePath: string) {
  return fileExtensions.has(path.extname(filePath));
}

function isAllowed(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  return allowedPaths.some((allowed) => normalized.includes(allowed));
}

function walk(dir: string, out: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".next", "node_modules", ".git", "test-results"].includes(entry.name)) continue;
      walk(fullPath, out);
      continue;
    }
    if (shouldInclude(fullPath)) out.push(fullPath);
  }
}

function run() {
  const files: string[] = [];
  for (const root of includeRoots) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    walk(fullRoot, files);
  }

  const findings: Finding[] = [];
  for (const file of files) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    if (isAllowed(rel)) continue;
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes('from "@/lib/prisma"') || line.includes("import { prisma }")) {
        findings.push({
          file: rel,
          line: idx + 1,
          text: line.trim(),
        });
      }
    });
  }

  if (findings.length === 0) {
    console.log("No disallowed Prisma touchpoints found.");
    return;
  }

  console.log("Disallowed Prisma touchpoints found:");
  for (const finding of findings) {
    console.log(`- ${finding.file}:${finding.line} -> ${finding.text}`);
  }
  console.log(`Total findings: ${findings.length}`);
  process.exitCode = 1;
}

run();
