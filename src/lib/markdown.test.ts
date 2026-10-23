import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";
import type { ImageOptimizeFn } from "./images";

describe("renderMarkdown", () => {
  it("demotes headings by one level", async () => {
    expect(await renderMarkdown("# A\n\n###### F")).toMatch(/<h2>A<\/h2>[\s\S]*<h6>F<\/h6>/);
  });
  it("opens external links in a new tab with a screen-reader hint", async () => {
    const html = await renderMarkdown("[x](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('<span class="sr-only"> (在新視窗開啟)</span>');
  });
  it("keeps internal links in the same tab", async () => {
    expect(await renderMarkdown("[x](/faq)")).not.toContain("target=");
  });
  it("wraps tables in a focusable horizontal scroll region", async () => {
    const html = await renderMarkdown("|a|b|\n|-|-|\n|1|2|");
    expect(html).toMatch(/role="region"[^>]*aria-label="表格（小螢幕可左右滑動）"[^>]*tabindex="0"/);
    expect(html).toContain('<table class="min-w-max border-collapse text-sm">');
  });
  it("lazy-loads images", async () => {
    expect(await renderMarkdown("![alt](/images/x.png)")).toMatch(/<img[^>]*loading="lazy"/);
  });
  it("gives images explicit size, async decoding and the old classes", async () => {
    const html = await renderMarkdown("![alt](/images/x.png)");
    expect(html).toContain('width="800"');
    expect(html).toContain('height="450"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('class="h-auto w-full"');
  });
  it("embeds a paragraph holding only a bare YouTube URL", async () => {
    const html = await renderMarkdown("https://www.youtube.com/watch?v=2A1ATKD-KBc&t=90");
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/2A1ATKD-KBc?start=90"');
    expect(html).toContain('title="YouTube 影片播放器（影片 2A1ATKD-KBc）"');
    expect(html).toContain("在 YouTube 觀看");
  });
  it("keeps a described YouTube link as a link", async () => {
    expect(await renderMarkdown("[報名](https://youtube.com/live/xAfbQIu2cT8)")).not.toContain("<iframe");
  });
  it("does not render raw HTML", async () => {
    const html = await renderMarkdown("<script>alert(1)</script>\n\ntext");
    expect(html).not.toContain("<script");
  });
  it("joins links split across lines", async () => {
    expect(await renderMarkdown("[a](\n  https://example.com\n)")).toContain('href="https://example.com"');
  });

  describe("url safety", () => {
    it("blanks javascript: links in any case", async () => {
      for (const u of ["javascript:alert(1)", "JaVaScRiPt:alert(1)"]) {
        const html = await renderMarkdown(`[x](${u})`);
        expect(html.toLowerCase()).not.toContain("javascript:");
        expect(html).not.toContain("href");
      }
    });
    it("blanks vbscript: and data: links", async () => {
      expect(await renderMarkdown("[x](vbscript:msgbox)")).not.toContain("href");
      expect(await renderMarkdown("[x](data:text/html,hi)")).not.toContain("href");
    });
    it("drops javascript: and data: images", async () => {
      expect(await renderMarkdown("![a](javascript:alert(1))")).not.toContain("<img");
      expect(await renderMarkdown("![a](data:image/png;base64,AAAA)")).not.toContain("<img");
    });
    it("keeps mailto and relative links", async () => {
      expect(await renderMarkdown("[m](mailto:a@b.co)")).toContain('href="mailto:a@b.co"');
      expect(await renderMarkdown("[r](/faq?x=a:b)")).toContain('href="/faq?x=a:b"');
      expect(await renderMarkdown("[h](#top)")).toContain('href="#top"');
    });
  });

  it("wraps images in the old spacing span", async () => {
    expect(await renderMarkdown("![alt](/images/x.png)")).toContain(
      '<span class="my-4 block overflow-hidden rounded-lg"><img'
    );
  });
  describe("responsive images", () => {
    const optimizeImage: ImageOptimizeFn = async (url) =>
      url.startsWith("/images/")
        ? { src: "/_img/x.h.1200.webp", srcset: "/_img/x.h.640.webp 640w, /_img/x.h.1200.webp 1200w", width: 1200, height: 900 }
        : null;

    it("uses the optimised variants, intrinsic size and the old sizes hint", async () => {
      const html = await renderMarkdown("![alt](/images/x.png)", { optimizeImage });
      expect(html).toContain('src="/_img/x.h.1200.webp"');
      expect(html).toContain('srcset="/_img/x.h.640.webp 640w, /_img/x.h.1200.webp 1200w"');
      expect(html).toContain('sizes="(max-width: 768px) 100vw, 800px"');
      expect(html).toContain('width="1200"');
      expect(html).toContain('height="900"');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('<span class="my-4 block overflow-hidden rounded-lg"><img');
    });
    it("leaves images the optimiser skips untouched", async () => {
      const html = await renderMarkdown("![a](https://example.com/a.jpg)", { optimizeImage });
      expect(html).toContain('src="https://example.com/a.jpg"');
      expect(html).not.toContain("srcset");
      expect(html).toContain('width="800"');
    });
    it("never hands unsafe URLs to the optimiser", async () => {
      const seen: string[] = [];
      const spy: ImageOptimizeFn = async (url) => {
        seen.push(url);
        return null;
      };
      await renderMarkdown("![a](javascript:alert(1))\n\n![b](/images/ok.png)", { optimizeImage: spy });
      expect(seen).toEqual(["/images/ok.png"]);
    });
    it("propagates optimiser failures so the build fails", async () => {
      const failing: ImageOptimizeFn = async () => {
        throw new Error("boom");
      };
      await expect(renderMarkdown("![a](/images/x.png)", { optimizeImage: failing })).rejects.toThrow("boom");
    });
  });
});
