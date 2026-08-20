import { describe, expect, it } from "vitest";
import {
  cn,
  formatDate,
  formatFileSize,
  stripMarkdown,
} from "./utils";

describe("formatDate", () => {
  it("formats an ISO date in Traditional Chinese", () => {
    expect(formatDate("2026-08-09T12:00:00+08:00")).toBe("2026年8月9日");
  });

  it("returns an empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("stripMarkdown", () => {
  it("removes markdown link syntax but keeps link text", () => {
    const result = stripMarkdown("[查看公告](https://example.com/path)");
    expect(result).toBe("查看公告");
  });

  it("keeps link text when an excerpt truncates the URL", () => {
    expect(stripMarkdown("> 原始公視新聞[連結](https://news.example/..."))
      .toBe("原始公視新聞連結");
  });

  it("removes images, headers and collapses whitespace", () => {
    const result = stripMarkdown(
      "# 標題\n\n![圖](image.jpg)\n\n第一段。\n\n第二段。"
    );
    expect(result).toBe("標題 第一段。 第二段。");
  });

  it("returns an empty string for empty input", () => {
    expect(stripMarkdown("")).toBe("");
  });
});

describe("cn", () => {
  it("merges and dedupes Tailwind classes", () => {
    expect(cn("px-2", "px-4 text-white")).toBe("px-4 text-white");
  });
});
