import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function loadApi() {
  vi.resetModules();
  return import("./api");
}

beforeEach(() => {
  vi.stubEnv("CONTENT_SOURCE", "api");
  vi.stubEnv("CMS_API_URL", "http://cms.test/api/v1");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "");
  vi.stubEnv("SITE_BUILD_TOKEN", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchAPI", () => {
  it("sends the build token header when SITE_BUILD_TOKEN is set", async () => {
    vi.stubEnv("SITE_BUILD_TOKEN", "t");
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await fetchAPI("/x");
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)["X-Site-Build-Token"]).toBe("t");
  });

  it("does not send the header when SITE_BUILD_TOKEN is empty", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await fetchAPI("/x");
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers as Record<string, string>).not.toHaveProperty(
      "X-Site-Build-Token"
    );
  });

  it("throws on non-2xx with the status code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 429)));
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).rejects.toThrow(/429/);
  });

  it("reads CMS_API_URL, falling back to NEXT_PUBLIC_API_URL", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    let api = await loadApi();
    await api.fetchAPI("/x");
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("http://cms.test/api/v1/x");

    vi.stubEnv("CMS_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://old.test/api/v1");
    api = await loadApi();
    await api.fetchAPI("/y");
    expect((fetchMock.mock.calls[1] as unknown[])[0]).toBe("http://old.test/api/v1/y");
  });

  it("memoizes identical requests within a build", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ a: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    const [a, b] = await Promise.all([fetchAPI("/x"), fetchAPI("/x")]);
    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("api mode error propagation", () => {
  it("getAllArticleSlugs rethrows in api mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 503)));
    const { getAllArticleSlugs } = await loadApi();
    await expect(getAllArticleSlugs("blog")).rejects.toThrow(/503/);
  });

  it("getAllPublicDocumentSlugs rethrows in api mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 503)));
    const { getAllPublicDocumentSlugs } = await loadApi();
    await expect(getAllPublicDocumentSlugs()).rejects.toThrow(/503/);
  });

  it("getOrganizationProfile rethrows in api mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));
    const { getOrganizationProfile } = await loadApi();
    await expect(getOrganizationProfile()).rejects.toThrow(/500/);
  });
});
