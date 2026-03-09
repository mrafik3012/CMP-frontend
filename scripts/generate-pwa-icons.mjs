#!/usr/bin/env node
/**
 * Generate 192 and 512 PNG icons from public/icons/icon.svg for PWA.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp --save-dev (or run npx pwa-asset-generator public/icons/icon.svg public/icons)
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "public", "icons");

try {
  const sharp = await import("sharp");
  const svg = readFileSync(join(iconsDir, "icon.svg"));
  for (const size of [192, 512]) {
    const buf = await sharp.default(svg).resize(size, size).png().toBuffer();
    writeFileSync(join(iconsDir, `icon-${size}.png`), buf);
    console.log(`Wrote public/icons/icon-${size}.png`);
  }
} catch (e) {
  if (e.code === "ERR_MODULE_NOT_FOUND" || e.message?.includes("sharp")) {
    console.log("Run: npx pwa-asset-generator public/icons/icon.svg public/icons --background '#0A0D12' --padding 0");
    console.log("Or: npm install sharp --save-dev then re-run this script.");
  }
  throw e;
}
