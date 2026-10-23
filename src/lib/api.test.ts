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
  vi.stubEnv("CMS_FETCH_RETRY_DELAYS_MS", "0,0");
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

describe("fetchAPI retries", () => {
  it("retries network errors and resolves, leaving one cache entry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await fetchAPI("/x");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after 3 attempts on persistent 503 with status in message", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 503));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI, ApiError } = await loadApi();
    const err = (await fetchAPI("/x").catch((e: unknown) => e)) as InstanceType<
      typeof ApiError
    >;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(503);
    expect(err.message).toMatch(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rethrows the last network error after 3 attempts", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).rejects.toThrow(/fetch failed/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry 404", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry 401", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).rejects.toThrow(/401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries 429 then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({ ok: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).resolves.toEqual({ ok: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancels the unconsumed body of a failed response before retrying", async () => {
    const cancel = vi.fn(async () => {});
    const failing = { ok: false, status: 503, statusText: "x", headers: new Headers(), body: { cancel } } as unknown as Response;
    const fetchMock = vi.fn().mockResolvedValueOnce(failing).mockResolvedValueOnce(jsonResponse({ ok: 3 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).resolves.toEqual({ ok: 3 });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("honours Retry-After seconds on 429, capped at 10 s", async () => {
    const delays: number[] = [];
    vi.stubGlobal("setTimeout", ((fn: () => void, ms?: number) => {
      delays.push(ms ?? 0);
      fn();
      return 0;
    }) as unknown as typeof setTimeout);
    const rl = (v: string) => new Response("{}", { status: 429, headers: { "retry-after": v } });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rl("2"))
      .mockResolvedValueOnce(rl("120"))
      .mockResolvedValueOnce(jsonResponse({ ok: 4 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await expect(fetchAPI("/x")).resolves.toEqual({ ok: 4 });
    expect(delays).toEqual([2000, 10000]);
  });

  it("passes an abort signal to each attempt", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAPI } = await loadApi();
    await fetchAPI("/x");
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
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

describe("public documents legacy fallback (api mode)", () => {
  const emptyList = { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } };
  const legacyDetail = {
    data: { id: 1, slug: "s", title: "T", content: "c", type: "document", attachments: [] },
    related: [],
  };

  function route(publicStatus: number) {
    return vi.fn(async (url: string) => {
      if (url.includes("/public-documents")) return jsonResponse({}, publicStatus);
      if (url.includes("/articles/s")) return jsonResponse(legacyDetail);
      if (url.includes("/articles")) return jsonResponse(emptyList);
      return jsonResponse({}, 500);
    });
  }

  it("getPublicDocuments rejects when /public-documents returns 503", async () => {
    vi.stubGlobal("fetch", route(503));
    const { getPublicDocuments } = await loadApi();
    await expect(getPublicDocuments()).rejects.toThrow(/503/);
  });

  it("getPublicDocument rejects when /public-documents/:slug returns 503", async () => {
    vi.stubGlobal("fetch", route(503));
    const { getPublicDocument } = await loadApi();
    await expect(getPublicDocument("s")).rejects.toThrow(/503/);
  });

  it("getPublicDocuments falls back to legacy articles on 404", async () => {
    const fetchMock = route(404);
    vi.stubGlobal("fetch", fetchMock);
    const { getPublicDocuments } = await loadApi();
    await expect(getPublicDocuments()).resolves.toMatchObject({ data: [] });
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/articles?"))).toBe(true);
  });

  it("getPublicDocument falls back to legacy article on 404", async () => {
    const fetchMock = route(404);
    vi.stubGlobal("fetch", fetchMock);
    const { getPublicDocument } = await loadApi();
    await expect(getPublicDocument("s")).resolves.toBeDefined();
    expect(fetchMock.mock.calls.some((c) => String(c[0]).endsWith("/articles/s"))).toBe(true);
  });
});

describe("getChineseStoryFallbackArticles", () => {
  it("fetches live blog story articles in api mode", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getChineseStoryFallbackArticles } = await loadApi();
    await expect(getChineseStoryFallbackArticles()).resolves.toEqual([]);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("type=blog");
    expect(url).toContain("category=story");
  });

  it("rethrows on failure in api mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 503)));
    const { getChineseStoryFallbackArticles } = await loadApi();
    await expect(getChineseStoryFallbackArticles()).rejects.toThrow(/503/);
  });
});
