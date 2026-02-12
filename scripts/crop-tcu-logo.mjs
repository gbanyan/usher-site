#!/usr/bin/env node
/**
 * Crop TCU logo: remove black block and trim excess white padding.
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../public/images/partners/tcu-logo.png");
const out = src;

const img = sharp(readFileSync(src));
const meta = await img.metadata();
const { width, height } = meta;

const raw = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const { data, info } = raw;
const channels = info.channels;

const isContent = (r, g, b, a) =>
  (a ?? 255) > 10 && (r > 30 || g > 30 || b > 30);
const isWhite = (r, g, b) => r > 240 && g > 240 && b > 240;

let left = 0, right = width - 1, top = 0, bottom = height - 1;

// Right edge: first non-black column from right
right: for (let x = width - 1; x >= 0; x--) {
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    if (isContent(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      right = x;
      break right;
    }
  }
}

// Left edge: first non-white column
left: for (let x = 0; x <= right; x++) {
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    if (!isWhite(data[i], data[i + 1], data[i + 2])) {
      left = Math.max(0, x - 4);
      break left;
    }
  }
}

// Top edge
top: for (let y = 0; y < height; y++) {
  for (let x = left; x <= right; x++) {
    const i = (y * width + x) * channels;
    if (!isWhite(data[i], data[i + 1], data[i + 2])) {
      top = Math.max(0, y - 4);
      break top;
    }
  }
}

// Bottom edge
bottom: for (let y = height - 1; y >= top; y--) {
  for (let x = left; x <= right; x++) {
    const i = (y * width + x) * channels;
    if (!isWhite(data[i], data[i + 1], data[i + 2])) {
      bottom = Math.min(height - 1, y + 4);
      break bottom;
    }
  }
}

const cropWidth = right - left + 1;
const cropHeight = bottom - top + 1;

console.log(`Original: ${width}x${height}, crop to ${cropWidth}x${cropHeight} (L${left} R${right} T${top} B${bottom})`);

await sharp(readFileSync(src))
  .extract({ left, top, width: cropWidth, height: cropHeight })
  .toFile(out);

console.log(`Saved: ${out}`);
