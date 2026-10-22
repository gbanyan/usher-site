import { describe, expect, it } from "vitest";
import {
  compareFacts, extractPageFacts, fieldOf, isAllowed, normalizeLocation, statusEquivalent,
} from "./parity";

const f = { title: "常見問題 | 台灣尤塞氏症暨視聽弱協會", h1: "常見問題", canonical: "https://www.usher.org.tw/faq", text: "常見問題 a b" };

describe("extractPageFacts", () => {
  it("extracts title, h1, canonical and main text", () => {
    const r = extractPageFacts('<title>常見問題 | 台灣尤塞氏症暨視聽弱協會</title><link rel="canonical" href="https://www.usher.org.tw/faq"><main><h1>常見問題</h1><p>a  b</p><script>x</script></main>');
    expect(r).toEqual(f);
  });
  it("drops style and ignores content outside main", () => {
    expect(extractPageFacts("<header>nav</header><main><style>p{}</style>hi</main>").text).toBe("hi");
  });
  it("normalises Cloudflare email placeholder and real addresses to one token", () => {
    const a = extractPageFacts("<main>mail [email&#160;protected] now</main>").text;
    const b = extractPageFacts("<main>mail info@usher.org.tw now</main>").text;
    const c = extractPageFacts("<main>mail [email protected] now</main>").text;
    expect(a).toBe(b); expect(b).toBe(c);
  });
});

describe("compareFacts", () => {
  it("reports no differences for equal facts", () => { expect(compareFacts(f, { ...f })).toEqual([]); });
  it("reports a text difference with context", () => {
    const d = compareFacts(f, { ...f, text: "常見問題 a c" });
    expect(d[0]).toMatch(/text/);
    expect(fieldOf(d[0])).toBe("text");
  });
  it("reports other fields", () => {
    expect(compareFacts(f, { ...f, h1: "x", title: "y" }).map(fieldOf)).toEqual(["title", "h1"]);
  });
});

describe("normalizeLocation", () => {
  it("reduces absolute urls to path+query", () => {
    expect(normalizeLocation("https://www.usher.org.tw/news?page=2")).toBe("/news?page=2");
    expect(normalizeLocation("/about")).toBe("/about");
    expect(normalizeLocation(null)).toBe("");
  });
});

describe("statusEquivalent", () => {
  it("treats 301 and 308 as the same", () => {
    expect(statusEquivalent(308, 301)).toBe(true);
    expect(statusEquivalent(200, 404)).toBe(false);
    expect(statusEquivalent(302, 307)).toBe(false);
  });
});

describe("isAllowed", () => {
  const allow = [
    { path: "/news", field: "text" as const, reason: "r" },
    { path: "/blog/*", field: "title" as const, reason: "r" },
  ];
  it("matches exact and prefix paths per field", () => {
    expect(isAllowed(allow, "/news", "text")).toBe("r");
    expect(isAllowed(allow, "/news", "title")).toBeUndefined();
    expect(isAllowed(allow, "/news/x", "text")).toBeUndefined();
    expect(isAllowed(allow, "/blog/abc", "title")).toBe("r");
    expect(isAllowed(allow, "/blogger", "title")).toBeUndefined();
  });
});

it("ignores whitespace-only text differences", () => {
  expect(compareFacts(f, { ...f, text: "常見問題a b " })).toEqual([]);
});

import { EXPECTED_404, compareEmails, extractEmails, mediaType, pageProblems, unexpectedStatus } from "./parity";

describe("pageProblems", () => {
  it("flags missing or empty main", () => {
    expect(pageProblems("<title>x</title><p>hi</p>")).toEqual(["no <main> element"]);
    expect(pageProblems("<main> <script>x</script> </main>")).toEqual(["empty <main> text"]);
    expect(pageProblems("<main>hi</main>")).toEqual([]);
  });
});

describe("unexpectedStatus", () => {
  it("allows 404 only for the expected probe URLs", () => {
    expect(unexpectedStatus("/About", 404)).toBeUndefined();
    expect(EXPECTED_404.has("/faq")).toBe(false);
    expect(unexpectedStatus("/faq", 404)).toMatch(/404/);
    expect(unexpectedStatus("/faq", 503)).toMatch(/503/);
    expect(unexpectedStatus("/faq", 0)).toMatch(/0/);
    expect(unexpectedStatus("/faq", 200)).toBeUndefined();
    expect(unexpectedStatus("/blog", 308)).toBeUndefined();
  });
});

describe("emails", () => {
  const page = (b: string) => `<main>${b}</main>`;
  it("detects a changed address", () => {
    const o = extractEmails(page("mail info@usher.org.tw"));
    const n = extractEmails(page("mail other@usher.org.tw"));
    expect(compareEmails(o, n).length).toBe(2);
  });
  it("treats placeholder vs real address as equal", () => {
    const o = extractEmails(page("mail [email&#160;protected]"));
    const n = extractEmails(page("mail info@usher.org.tw"));
    expect(compareEmails(o, n)).toEqual([]);
  });
  it("flags a missing address when old placeholder count is not met", () => {
    expect(compareEmails(extractEmails(page("[email protected]")), extractEmails(page("none"))).length).toBe(1);
  });
  it("flags clear-text old address missing on new", () => {
    expect(compareEmails(extractEmails(page("a@b.org")), extractEmails(page("x")))[0]).toMatch(/missing/);
  });
});

it("compares media types without parameters", () => {
  expect(mediaType("Application/PDF; charset=x")).toBe("application/pdf");
  expect(mediaType(null)).toBe("");
});
