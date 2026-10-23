import { expect, it } from "vitest";
import { safeUrl } from "./url";

it("keeps http(s), mailto and relative URLs", () => {
  for (const u of ["https://member.usher.org.tw/a.pdf", "http://x.test/", "mailto:a@b.c", "/attachment/a.pdf", "a/b?x=1:2", "#top"]) {
    expect(safeUrl(u)).toBe(u);
  }
});
it("drops script-capable protocols", () => {
  for (const u of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "vbscript:x"]) {
    expect(safeUrl(u)).toBe("");
  }
});
