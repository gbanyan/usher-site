import { describe, expect, it } from "vitest";
import {
  cn,
  formatDate,
  formatFileSize,
  getEmbeddableYouTubeId,
  getYouTubeVideoId,
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

describe("getYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://youtube.com/watch?v=2A1ATKD-KBc&t=30s", "2A1ATKD-KBc"],
    ["https://m.youtube.com/watch?v=2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://youtu.be/2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://www.youtube.com/live/2A1ATKD-KBc?si=x", "2A1ATKD-KBc"],
  ])("extracts the id from %s", (href, id) => {
    expect(getYouTubeVideoId(href)).toBe(id);
  });

  it.each([
    "https://www.youtube.com/@台灣尤塞氏症暨視聽弱",
    "https://www.youtube.com/watch?v=short",
    "https://example.com/watch?v=2A1ATKD-KBc",
    "not a url",
  ])("returns null for %s", (href) => {
    expect(getYouTubeVideoId(href)).toBeNull();
  });
});

describe("getEmbeddableYouTubeId", () => {
  const href = "https://www.youtube.com/watch?v=2A1ATKD-KBc";

  it("embeds a bare YouTube URL", () => {
    expect(getEmbeddableYouTubeId(href, href)).toBe("2A1ATKD-KBc");
  });

  it("embeds when surrounding whitespace differs", () => {
    expect(getEmbeddableYouTubeId(href, `  ${href}\n`)).toBe("2A1ATKD-KBc");
  });

  it("keeps a descriptive YouTube link as a normal link", () => {
    expect(
      getEmbeddableYouTubeId(
        "https://youtube.com/live/xAfbQIu2cT8",
        "線上直播報名頁（12/7 開播）"
      )
    ).toBeNull();
  });

  it("ignores non-YouTube URLs", () => {
    expect(
      getEmbeddableYouTubeId("https://example.com/", "https://example.com/")
    ).toBeNull();
  });
});
