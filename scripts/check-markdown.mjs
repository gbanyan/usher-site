#!/usr/bin/env node
/**
 * Check Markdown content in content-snapshots for formatting errors.
 * Detects: ** ** (empty bold), unclosed ** or *, odd asterisk counts, etc.
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const SNAPSHOTS_DIR = join(process.cwd(), "content-snapshots");

function extractContent(obj, filePath) {
  const results = [];
  if (!obj || typeof obj !== "object") return results;

  // Article/Page detail: { data: { content, title, slug } }
  if (obj.data?.content && typeof obj.data.content === "string") {
    results.push({
      path: filePath,
      content: obj.data.content,
      title: obj.data.title || obj.data.slug,
      slug: obj.data.slug,
    });
    return results;
  }

  // List files: { data: [ { content, ... }, ... ] }
  if (Array.isArray(obj.data)) {
    for (const item of obj.data) {
      if (item?.content && typeof item.content === "string") {
        results.push({
          path: filePath,
          content: item.content,
          title: item.title || item.slug,
          slug: item.slug,
        });
      }
    }
    return results;
  }

  // Direct content
  if (obj.content && typeof obj.content === "string") {
    results.push({
      path: filePath,
      content: obj.content,
      title: obj.title || obj.slug,
      slug: obj.slug,
    });
  }
  return results;
}

function checkMarkdown(content, source) {
  const issues = [];
  const lines = content.split("\n");

  // 1. ** ** or **  ** - empty bold on SAME LINE (space/tab between, not newline)
  const emptyBold = /\*\*[ \t]+\*\*/g;
  let m;
  while ((m = emptyBold.exec(content)) !== null) {
    const lineNum = content.slice(0, m.index).split("\n").length;
    issues.push({
      type: "empty_bold",
      desc: "空的粗體標記 ** **（同一行內只有空白）",
      line: lineNum,
      snippet: getSnippet(content, m.index),
    });
  }

  // 2. Odd number of ** (unclosed bold)
  const boldMatches = content.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    issues.push({
      type: "unclosed_bold",
      desc: `** 數量為奇數 (${boldMatches.length})，可能有未閉合的粗體`,
      line: null,
      snippet: findFirstUnclosed(content, "**"),
    });
  }

  // 4. [text](url - unclosed link (link with URL on new line or missing )
  const unclosedLink = /\[([^\]]+)\]\(([^)]*)$/gm;
  while ((m = unclosedLink.exec(content)) !== null) {
    const lineNum = content.slice(0, m.index).split("\n").length;
    issues.push({
      type: "unclosed_link",
      desc: "連結未正確閉合 [text](url（URL 可能換行或缺少 )）",
      line: lineNum,
      snippet: m[0],
    });
  }

  // 5. ](url] - wrong bracket (should be ) not ])
  const wrongBracket = /\]\([^)]*\]/g;
  while ((m = wrongBracket.exec(content)) !== null) {
    const lineNum = content.slice(0, m.index).split("\n").length;
    issues.push({
      type: "wrong_link_bracket",
      desc: "連結結尾用了 ] 而非 )",
      line: lineNum,
      snippet: m[0],
    });
  }

  // 6. ~~ ~~ (empty strikethrough)
  const emptyStrike = /~~\s+~~/g;
  while ((m = emptyStrike.exec(content)) !== null) {
    const lineNum = content.slice(0, m.index).split("\n").length;
    issues.push({
      type: "empty_strikethrough",
      desc: "空的刪除線 ~~ ~~",
      line: lineNum,
      snippet: getSnippet(content, m.index),
    });
  }

  return issues;
}

function getSnippet(content, index, len = 60) {
  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + len);
  return content.slice(start, end).replace(/\n/g, "↵");
}

function findFirstUnclosed(content, mark) {
  let count = 0;
  let pos = 0;
  while ((pos = content.indexOf(mark, pos)) !== -1) {
    count++;
    if (count % 2 !== 0 && pos + mark.length < content.length) {
      return getSnippet(content, pos, 80);
    }
    pos += mark.length;
  }
  return null;
}

async function main() {
  const allIssues = [];

  async function walk(dir, prefix = "") {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full, `${prefix}${e.name}/`);
      } else if (e.name.endsWith(".json")) {
        const raw = await readFile(full, "utf-8");
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }
        const items = extractContent(data, `${prefix}${e.name}`);
        for (const { path, content, title, slug } of items) {
          const issues = checkMarkdown(content, path);
          if (issues.length > 0) {
            allIssues.push({
              file: path,
              title: title || slug,
              slug,
              issues,
            });
          }
        }
      }
    }
  }

  await walk(SNAPSHOTS_DIR);

  // Report
  console.log("=== Markdown 格式檢查報告 ===\n");

  if (allIssues.length === 0) {
    console.log("✓ 未發現明顯的 Markdown 格式錯誤。\n");
    return;
  }

  for (const { file, title, slug, issues } of allIssues) {
    console.log(`\n📄 ${title || slug || file}`);
    console.log(`   檔案: ${file}`);
    console.log(`   slug: ${slug || "(無)"}`);
    for (const issue of issues) {
      console.log(`   ⚠ ${issue.type}: ${issue.desc}`);
      if (issue.line) console.log(`     行號: ${issue.line}`);
      if (issue.snippet) console.log(`     片段: "...${issue.snippet}..."`);
    }
  }

  console.log(`\n\n共發現 ${allIssues.length} 個檔案有潛在問題，${allIssues.reduce((s, i) => s + i.issues.length, 0)} 個問題。`);
}

main().catch(console.error);
