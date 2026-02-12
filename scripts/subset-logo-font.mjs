#!/usr/bin/env node
/**
 * Subset Iansui font for logo text: 台灣尤塞氏症暨視聽弱協會
 * Output: public/fonts/iansui-logo.woff2 (~6KB)
 *
 * Requires: python3 with fonttools (pip install fonttools brotli)
 * or: uv run pyftsubset (fonttools)
 */
import { execSync } from "child_process";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const FONT_URL = "https://github.com/ButTaiwan/iansui/raw/main/fonts/ttf/Iansui-Regular.ttf";
const TEXT = "台灣尤塞氏症暨視聽弱協會";
const OUT_DIR = join(process.cwd(), "public", "fonts");
const OUT_FILE = join(OUT_DIR, "iansui-logo.woff2");
const TMP_DIR = join(process.cwd(), "scripts", ".tmp");

async function main() {
  const tmpFont = join(TMP_DIR, "Iansui-Regular.ttf");

  if (!existsSync(tmpFont)) {
    console.log("Downloading Iansui font...");
    mkdirSync(TMP_DIR, { recursive: true });
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { writeFileSync } = await import("fs");
    writeFileSync(tmpFont, buf);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const venvPyftsubset = join(process.cwd(), ".venv", "bin", "pyftsubset");
  const pyftsubset = existsSync(venvPyftsubset) ? venvPyftsubset : "pyftsubset";
  const cmd = [
    pyftsubset,
    tmpFont,
    `--text=${TEXT}`,
    `--output-file=${OUT_FILE}`,
    "--flavor=woff2",
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`Generated ${OUT_FILE}`);
  } catch (e) {
    console.error(
      "pyftsubset failed. Install fonttools: pip install fonttools brotli"
    );
    process.exit(1);
  }
}

main();
