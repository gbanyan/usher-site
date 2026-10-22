import { expect, it } from "vitest";
import config from "../../vercel.json";
const REDIRECTS = [["/blog","/news"],["/notice","/news"],["/message","/about"],["/research","/document"],["/logo_represent","/logo-represent"]];
it.each(REDIRECTS)("permanently redirects %s to %s", (s, d) => {
  expect(config.redirects).toContainEqual({ source: s, destination: d, permanent: true });
});
it("serves clean URLs without trailing slashes", () => {
  expect(config.cleanUrls).toBe(true); expect(config.trailingSlash).toBe(false); expect(config.outputDirectory).toBe("dist");
  expect(config.framework).toBe("astro"); expect(config.buildCommand).toBe("npm run build");
});
