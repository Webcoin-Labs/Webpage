#!/usr/bin/env node
/**
 * Copy legacy partner logos from _legacy into public/network.
 * Does NOT delete originals. Renames to kebab-case (vc-1.png, launchpad-1.png, etc.).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function toKebab(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function main() {
  let copied = 0;

  // --- VCs: _legacy/vcs → legacy/vc (all) + current/vc (first 8)
  const vcsDir = path.join(root, "_legacy", "vcs");
  const vcFiles = fs.existsSync(vcsDir)
    ? fs.readdirSync(vcsDir).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
    : [];
  vcFiles.sort();
  vcFiles.forEach((file, i) => {
    const idx = i + 1;
    const ext = path.extname(file);
    const destName = `vc-${idx}${ext}`;
    const src = path.join(vcsDir, file);
    const destLegacy = path.join(root, "public", "network", "legacy", "vc", destName);
    if (copyFile(src, destLegacy)) copied++;
    if (idx <= 8) {
      const destCurrent = path.join(root, "public", "network", "current", "vc", destName);
      if (copyFile(src, destCurrent)) copied++;
    }
  });

  // --- Launchpads: _legacy/launchpad → legacy/launchpads + current/launchpads (first 8)
  const lpDir = path.join(root, "_legacy", "launchpad");
  const lpFiles = fs.existsSync(lpDir)
    ? fs.readdirSync(lpDir).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
    : [];
  lpFiles.sort();
  lpFiles.forEach((file, i) => {
    const idx = i + 1;
    const ext = path.extname(file);
    const destName = `launchpad-${idx}${ext}`;
    const src = path.join(lpDir, file);
    const destLegacy = path.join(root, "public", "network", "legacy", "launchpads", destName);
    if (copyFile(src, destLegacy)) copied++;
    if (idx <= 8) {
      const destCurrent = path.join(root, "public", "network", "current", "launchpads", destName);
      if (copyFile(src, destCurrent)) copied++;
    }
  });

  // --- Portfolio: _legacy/logo-designs/New Design of logo (selected partner/portfolio logos only)
  const portfolioDir = path.join(root, "_legacy", "logo-designs", "New Design of logo");
  const portfolioCandidates = [
    "Bitbrawl_Logo.png",
    "Corite CO-logo-neg-rgb-2000px.png",
    "dropp_logo_black-01.png",
    "KPC_Black.png",
    "AltavaGroup_LogoMark_onDark.png",
  ];
  if (fs.existsSync(portfolioDir)) {
    portfolioCandidates.forEach((file, i) => {
      const src = path.join(portfolioDir, file);
      if (!fs.existsSync(src)) return;
      const base = toKebab(path.basename(file, path.extname(file))) || `portfolio-${i + 1}`;
      const ext = path.extname(file);
      const destName = `${base}${ext}`;
      const destLegacy = path.join(root, "public", "network", "legacy", "portfolio", destName);
      if (copyFile(src, destLegacy)) copied++;
    });
  }

  console.log(`Copied ${copied} logo files to public/network (originals unchanged).`);
}

main();
