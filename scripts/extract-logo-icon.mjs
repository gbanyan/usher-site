#!/usr/bin/env node
/**
 * Extract logo icon from Logo_long.png (left square portion).
 * Output: public/images/logo-icon.png — high-res icon for Header/Footer.
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../public/images/Logo_long.png");
const out = join(__dirname, "../public/images/logo-icon.png");

const meta = await sharp(readFileSync(src)).metadata();
const { width, height } = meta;

// Icon is square; in 2000×408, use full height (408) for icon size
const size = Math.min(height, width);
await sharp(readFileSync(src))
  .extract({ left: 0, top: 0, width: size, height: size })
  .png()
  .toFile(out);

console.log(`Extracted ${size}×${size} icon → ${out}`);
