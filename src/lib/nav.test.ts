import { describe, expect, it } from "vitest";
import { isNavHrefActive } from "./nav";

describe("isNavHrefActive", () => {
  it("matches a section and its detail pages", () => {
    expect(isNavHrefActive("/story", "/story")).toBe(true);
    expect(isNavHrefActive("/story", "/story/document-694e4dd6")).toBe(true);
    expect(isNavHrefActive("/story", "/guides")).toBe(false);
  });

  it("treats blog and notice detail pages as part of /news", () => {
    expect(isNavHrefActive("/news", "/news")).toBe(true);
    expect(isNavHrefActive("/news", "/blog/20240406-usher-working-group")).toBe(true);
    expect(isNavHrefActive("/news", "/notice/20240111-first-committee")).toBe(true);
  });

  it("does not match unrelated paths that share a prefix", () => {
    expect(isNavHrefActive("/news", "/newsletter")).toBe(false);
    expect(isNavHrefActive("/news", "/blogroll")).toBe(false);
    expect(isNavHrefActive("/related-news", "/news")).toBe(false);
  });
});
