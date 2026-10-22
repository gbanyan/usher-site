# Astro 改寫 — 網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite usher-site from Next.js to a fully static Astro site with identical URLs, content and accessibility, then cut over on Vercel with the CMS switched to deploy-hook rebuilds.

**Architecture:**
- **Astro static output.** Astro builds every page once and writes plain files: `build.format: "file"`, with Vercel `cleanUrls` and no trailing slash, so URLs match today's.
- **Shared code.** The framework-neutral modules in `src/lib/` stay; only their Next-specific bits are removed.
- **Interactivity.** Interactive parts become small vanilla-TypeScript `<script>`s inside `.astro` components, not React islands.
- **Markdown.** It is rendered to HTML at build time by a tested `renderMarkdown()` unified pipeline.
- **Redirects.** Permanent redirects live in `vercel.json`, because Astro's own static redirects are meta-refresh pages, not 308s.

**Tech Stack:** Astro（latest stable at install time）, TypeScript, Tailwind CSS 4 via `@tailwindcss/vite` + `@tailwindcss/typography`, unified/remark/rehype, Vitest, Pagefind 1.5.2.

**Spec:** `docs/superpowers/specs/2026-10-22-astro-migration-design.md`

**Depends on:** `docs/superpowers/plans/2026-10-22-astro-migration-cms.md` must be fully deployed first. It provides `SITE_BUILD_TOKEN`, deploy-hook mode and the daily rebuild.

## Global Constraints

- 所有網址、轉址、內容、metadata（title 模板 `%s | 台灣尤塞氏症暨視聽弱協會`、description、canonical、Open Graph、Twitter、`geo.region: TW`、`geo.placename: Taiwan`、alternate languages）與 JSON-LD 都維持與正式站一致。
- 五條永久轉址：`/blog`→`/news`、`/notice`→`/news`、`/message`→`/about`、`/research`→`/document`、`/logo_represent`→`/logo-represent`。
- 無障礙底線：每頁最多一個 h1；`.skip-to-content` 連到 `#main-content`；`main#main-content` 有 `tabIndex=-1`；`:focus-visible` 焦點框規則（見 `scripts/check-a11y-static.mjs` 的 `FOCUS_RULE`、`FOCUS_OFFSET`）；下拉選單和手機選單支援鍵盤操作與 Escape 關閉；輪播有暫停按鈕，並遵守 `prefers-reduced-motion`；外部連結有螢幕閱讀器提示。
- 視覺可以因採用 Astro 寫法而小幅改變；`globals.css` 的主題色、系統字型堆疊、`/fonts/iansui-logo.woff2` 的 Logo 字型都不變。
- `public/` 的目錄結構與檔名一律不變（後台的自動推送會寫入 `public/uploads/` 等目錄）。
- 環境變數改名：`CMS_API_URL`（取代 `NEXT_PUBLIC_API_URL`）、`SITE_URL`（取代 `NEXT_PUBLIC_SITE_URL`）、`CONTENT_SOURCE` 不變，新增 `SITE_BUILD_TOKEN`。過渡期間程式要能讀取舊名稱作為 fallback。
- 每個打 CMS API 的請求，在 `SITE_BUILD_TOKEN` 有值時都要帶上 `X-Site-Build-Token` 標頭，包括 `src/lib/api.ts` 和 `scripts/snapshot-content.mjs`。
- 改寫在 `astro-migration` 分支上進行；`main` 在 cutover 之前不動（後台的自動推送仍會推到 `main`）。
- 驗證指令：`npm run test`、`npm run lint`（`astro check` + eslint）、`npm run build`、`npm run check:a11y`、`npm run check:content`、`npm run check:assets`。
- 需要舊實作作為參考時，用 `git show main:<path>`；舊檔案會在 Task 1 從分支上刪除。
- **建置必須「全有或全無」**：`CONTENT_SOURCE=api` 時，任何 CMS 請求失敗都要讓 `astro build` 以非 0 結束。`getStaticPaths` 和頁面 frontmatter 裡不准 `catch` 之後回傳空陣列，或改用 fallback 資料；Next.js 時代的 `catch { return [] }` 在靜態輸出下會直接造成缺頁。`snapshot` 模式保留現有的 fallback。
- **路由路徑**：`build.format: "file"` 會讓 `Astro.url.pathname` 變成 `/about.html` 這種形式。導覽的目前頁面判斷、canonical、連結一律使用 Task 1 的 `toRoutePath()`，不要直接使用 `Astro.url`。
- **圖片**：一律輸出 `<img>`，並帶上明確的 `width`、`height`、`decoding="async"`。除了首頁輪播的第一張之外都加 `loading="lazy"`。Markdown 圖片沿用舊的 800×450 加 `h-auto w-full`。合作夥伴的遠端 Logo 直接連原網址；不使用 `astro:assets` 的遠端優化。
- **Pagefind 索引範圍**：照現況，只在文章詳細頁、文件詳細頁、`/about`、CMS 頁面、`/en` 的內容區加 `data-pagefind-body`；導覽、頁尾、相關文章區塊加 `data-pagefind-ignore`。
- **改寫期間不准修改 Vercel 專案的 Build & Output 設定**（Framework Preset、Output Directory、Build Command）。分支的建置設定全部放在 `vercel.json`；`main` 在 cutover 之前仍然是 Next.js，後台的自動推送會持續觸發正式部署。

## Review Focus

- CMS 文章內容含原始 HTML（例如 `<br/>`、`<script>`）→ 不渲染、不執行，比照現況（react-markdown 預設不渲染原始 HTML）。（Task 3 `renderMarkdown` 測試 `does not render raw HTML`）
- 網址大小寫或結尾斜線不同（`/About`、`/news/`）→ 結尾斜線用 308 轉到沒有斜線的版本，與現況相同；大小寫錯誤照舊回傳 404。（Task 2 `vercel.json` 測試加上 `trailingSlash: false`、`cleanUrls: true` 斷言；Task 10 的比對清單要包含 `/news/`）
- 建置時 CMS 某個 API 回傳錯誤 → 整次建置失敗並以非 0 結束，不產生缺頁的網站（spec §4.3）。（Task 1 `api.ts` 測試 `fetchAPI throws on non-2xx`）
- 沒有 JavaScript 時 → 文章列表全部顯示（不分頁）、選單連結都可以點、輪播第一張可以看到。（Task 5、Task 7 的建置後 HTML 檢查）
- 英文頁的 `<html lang>` → `/en` 輸出 `lang="en"`，其餘頁面輸出 `lang="zh-TW"`。（Task 4 建置後檢查）
- 建置時 CMS 暫時回傳 429 或 5xx → 不能部署一個缺文章頁的網站。（Task 1 測試 `getAllArticleSlugs rethrows in api mode`，加上 Task 5 的 `check:build-coverage`）
- 每頁都呼叫組織資料、重複呼叫文章清單 → 同一個網址一次建置只打一次 CMS。（Task 1 測試 `fetchAPI memoizes identical requests within a build`）

---

### Task 1: 建立 Astro 骨架，並移植 `src/lib`

**Files:**
- Branch: `git checkout -b astro-migration`
- Delete: `src/app/`, `src/components/*.tsx`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`（改用新設定）、Next 相關依賴
- Create: `astro.config.mjs`, `src/styles/global.css`（從 `src/app/globals.css` 搬過來）, `src/pages/index.astro`（暫時的頁面）, `vitest.config.ts`（如果需要）, `eslint.config.mjs`
- Modify: `package.json`, `tsconfig.json`, `src/lib/api.ts`, `src/lib/site.ts`, `src/lib/metadata.ts`, `src/lib/jsonld.ts`（如果有 import `next`）
- Test: `src/lib/api.test.ts`（新）, `src/lib/metadata.test.ts`（新），以及既有的 `src/lib/*.test.ts`

**Interfaces:**
- Produces:
  - `astro.config.mjs`：`site: process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4321"`、`output: "static"`、`build: { format: "file" }`、`trailingSlash: "never"`、`vite: { plugins: [tailwindcss()] }`
  - `src/lib/api.ts`：`fetchAPI<T>(endpoint: string): Promise<T>`。
    - 拿掉 Next 的 `revalidate`／`tags` 選項；
    - 非 2xx 時拋出 `Error`，訊息要包含狀態碼；
    - 有 `SITE_BUILD_TOKEN` 時帶 `X-Site-Build-Token`；
    - 用模組層級的 `Map<string, Promise<unknown>>` 記住同一次建置裡的相同請求。
  - `api` 模式下，`getAllArticleSlugs`、`getAllPublicDocumentSlugs`、`getOrganizationProfile` 要把錯誤往上拋，不再回傳 `[]` 或 fallback。`snapshot` 模式維持原本的 fallback。其他 export 的名稱與簽名全部不變。
  - `src/lib/nav.ts`：新增 `toRoutePath(pathname: string): string`，把 `/about.html` 轉成 `/about`、`/index.html` 轉成 `/`、`/blog/x.html` 轉成 `/blog/x`。
  - `src/lib/metadata.ts`：`export interface PageMeta { title: string; absoluteTitle?: boolean; description: string; canonical: string; keywords?: string; ogType: "website" | "article"; image: string; publishedTime?: string; locale: "zh_TW" | "en_US"; siteName: string; alternates?: { "zh-TW": string; en: string } }`。`buildArticleMetadata(...)` 和 `buildPageMetadata(...)` 參數不變，改為回傳 `PageMeta`。另外新增 `buildHomeMetadata(lang: "zh-TW" | "en"): PageMeta`，內容取自 `git show main:src/app/layout.tsx` 的預設 title、description，以及 `main:src/app/en/layout.tsx` 的 `absolute` title、`en_US`、英文 `siteName`；`/` 和 `/en` 互相列為 alternates。
  - `package.json` scripts：`dev: astro dev`、`build: astro build && pagefind --site dist --output-subdir _pagefind && node scripts/check-build-coverage.mjs`、`preview: astro preview`、`test: vitest run`、`lint: astro check && eslint .`（eslint 使用 `eslint-plugin-astro` 加 `typescript-eslint`），其餘 `check:*`、`snapshot`、`refresh:content` 保留。`check-build-coverage.mjs` 在 Task 5 建立；Task 5 之前，`build` 先不串這一段。

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/api.test.ts — stub global fetch with vi.stubGlobal
it("sends the build token header when SITE_BUILD_TOKEN is set", async () => { /* expect init.headers["X-Site-Build-Token"] === "t" */ });
it("does not send the header when SITE_BUILD_TOKEN is empty", async () => {});
it("fetchAPI throws on non-2xx", async () => { await expect(fetchAPI("/x")).rejects.toThrow(/429/); });
it("reads CMS_API_URL, falling back to NEXT_PUBLIC_API_URL", async () => {});
it("fetchAPI memoizes identical requests within a build", async () => { /* two calls → fetch called once */ });
it("getAllArticleSlugs rethrows in api mode", async () => { /* fetch → 503; expect rejects */ });
it("getOrganizationProfile rethrows in api mode", async () => {});
// src/lib/nav.test.ts
it.each([["/about.html","/about"],["/index.html","/"],["/blog/x.html","/blog/x"],["/news","/news"],["/","/"]])("toRoutePath(%s) = %s", (a, b) => expect(toRoutePath(a)).toBe(b));
// src/lib/metadata.test.ts
it("buildPageMetadata returns canonical from SITE_URL + path", () => {
  expect(buildPageMetadata("常見問題", "desc", "/faq").canonical).toBe("https://www.usher.org.tw/faq");
});
it("buildArticleMetadata strips markdown from the description and uses the featured image", () => {});
it("buildHomeMetadata('en') uses an absolute English title, en_US and alternates", () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/api.test.ts src/lib/metadata.test.ts`
Expected: FAIL，原因是 header／canonical 的斷言不符，或 `next` 的 import 無法解析。

- [ ] **Step 3: Implement**：安裝 `astro @astrojs/check typescript eslint eslint-plugin-astro typescript-eslint @tailwindcss/vite @tailwindcss/typography unified remark-parse remark-gfm remark-rehype rehype-stringify unist-util-visit hast-util-to-string`，移除 `next react react-dom swiper cmdk @radix-ui/react-dialog react-markdown eslint-config-next @types/react*`。依照 Interfaces 修改 `src/lib` 和設定檔。`process.env` 在 Astro 建置時可以讀取，`api.ts` 繼續使用它。

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test && npm run build`
Expected：所有 Vitest 測試 PASS；`dist/index.html` 存在。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: replace Next.js with an Astro static scaffold, keep src/lib"
```

---

### Task 2: `vercel.json`（轉址、clean URLs）

**Files:**
- Create: `vercel.json`
- Test: `src/lib/vercel-config.test.ts`

**Interfaces:**
- Produces：`vercel.json` 內容為 `{ "framework": "astro", "buildCommand": "npm run build", "outputDirectory": "dist", "cleanUrls": true, "trailingSlash": false, "redirects": [...] }`，五條轉址都設 `"permanent": true`。

- [ ] **Step 1: Write the failing test**

```ts
import config from "../../vercel.json";
const REDIRECTS = [["/blog","/news"],["/notice","/news"],["/message","/about"],["/research","/document"],["/logo_represent","/logo-represent"]];
it.each(REDIRECTS)("permanently redirects %s to %s", (s, d) => {
  expect(config.redirects).toContainEqual({ source: s, destination: d, permanent: true });
});
it("serves clean URLs without trailing slashes", () => {
  expect(config.cleanUrls).toBe(true); expect(config.trailingSlash).toBe(false); expect(config.outputDirectory).toBe("dist");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/vercel-config.test.ts`
Expected: FAIL，錯誤為找不到 `vercel.json`。

- [ ] **Step 3: Implement**：建立 `vercel.json`，tsconfig 開啟 `resolveJsonModule`。

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/vercel-config.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add vercel.json src/lib/vercel-config.test.ts tsconfig.json && git commit -m "feat: define permanent redirects and clean URLs in vercel.json"
```

---

### Task 3: `renderMarkdown()`（建置時把 Markdown 轉成 HTML）

**Files:**
- Create: `src/lib/markdown.ts`, `src/components/Markdown.astro`
- Test: `src/lib/markdown.test.ts`

**Interfaces:**
- Produces:
  - `renderMarkdown(markdown: string): Promise<string>`：unified 管線依序為 `remark-parse` → `remark-gfm` → 自訂的多行連結正規化（沿用舊 `normalizeMultilineLinks` 的 regex，在 parse 之前對字串處理）→ `remark-rehype`（不允許危險 HTML）→ 自訂 rehype plugin → `rehype-stringify`。
  - `Markdown.astro` props：`{ content: string; class?: string }`。輸出 `<div class="prose prose-invert prose-dark prose-lg max-w-none prose-headings:text-white prose-a:text-accent hover:prose-a:text-accent-light prose-img:rounded-lg {class}" set:html={html} />`。
- Consumes: `getEmbeddableYouTubeId`, `getYouTubeEmbedUrl`, `getYouTubeVideoId`（`src/lib/utils.ts`）。

- [ ] **Step 1: Write the failing tests**（行為以 `git show main:src/components/MarkdownRenderer.tsx` 為準）

```ts
it("demotes headings by one level", async () => { expect(await renderMarkdown("# A\n\n###### F")).toMatch(/<h2>A<\/h2>[\s\S]*<h6>F<\/h6>/); });
it("opens external links in a new tab with a screen-reader hint", async () => {
  const html = await renderMarkdown("[x](https://example.com)");
  expect(html).toContain('target="_blank"'); expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('<span class="sr-only"> (在新視窗開啟)</span>'); });
it("keeps internal links in the same tab", async () => { expect(await renderMarkdown("[x](/faq)")).not.toContain("target="); });
it("wraps tables in a focusable horizontal scroll region", async () => {
  const html = await renderMarkdown("|a|b|\n|-|-|\n|1|2|");
  expect(html).toMatch(/role="region"[^>]*aria-label="表格（小螢幕可左右滑動）"[^>]*tabindex="0"/); });
it("lazy-loads images", async () => { expect(await renderMarkdown("![alt](/images/x.png)")).toMatch(/<img[^>]*loading="lazy"/); });
it("embeds a paragraph holding only a bare YouTube URL", async () => {
  const html = await renderMarkdown("https://www.youtube.com/watch?v=2A1ATKD-KBc&t=90");
  expect(html).toContain('src="https://www.youtube-nocookie.com/embed/2A1ATKD-KBc?start=90"');
  expect(html).toContain('title="YouTube 影片播放器（影片 2A1ATKD-KBc）"'); expect(html).toContain("在 YouTube 觀看"); });
it("keeps a described YouTube link as a link", async () => {
  expect(await renderMarkdown("[報名](https://youtube.com/live/xAfbQIu2cT8)")).not.toContain("<iframe"); });
it("does not render raw HTML", async () => {
  const html = await renderMarkdown("<script>alert(1)</script>\n\ntext"); expect(html).not.toContain("<script"); });
it("joins links split across lines", async () => {
  expect(await renderMarkdown("[a](\n  https://example.com\n)")).toContain('href="https://example.com"'); });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: FAIL，錯誤為 `Cannot find module './markdown'`。

- [ ] **Step 3: Implement**：寫一個 rehype plugin，用 `unist-util-visit` 做以下處理：
  - 標題降一級，h6 維持 h6；
  - 外部連結（`http` 開頭）加上 target、rel，並附加 sr-only 的 span；
  - `table` 外面包一層 `div`，class 照舊實作的 `my-4 -mx-2 overflow-x-auto rounded-lg border border-white/10 px-2 sm:mx-0 sm:px-0`，再加上 `role`、`aria-label`、`tabindex`；table 本身加上 `min-w-max border-collapse text-sm`；
  - `img` 加 `loading="lazy"`；
  - 段落去掉空白文字節點後，如果只剩一個 `a`，就用 `getEmbeddableYouTubeId(href, 文字)` 判斷，符合時把整個段落換成 figure 結構（比照舊的 `YouTubeEmbed`）。

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/markdown.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts src/components/Markdown.astro && git commit -m "feat: render CMS markdown at build time with the existing behaviours"
```

---

### Task 4: 共用版型（`<head>`、Header、Footer、跳到主內容、捲到頂端）

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Head.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/Logo.astro`, `src/components/ScrollToTop.astro`, `src/components/JsonLd.astro`, `src/components/PageHeader.astro`
- Modify: `scripts/check-a11y-static.mjs`（`HTML_DIR` 改為 `dist`，`CSS_DIR` 改為 `dist/_astro`，轉址頁的豁免清單移除）
- Reference: `git show main:src/app/layout.tsx`, `main:src/components/{Header,Footer,Logo,ScrollToTop,PageHeader,LocaleDocument}.tsx`, `main:src/lib/i18n.ts`

**Interfaces:**
- Produces: `BaseLayout.astro` props：`{ meta: PageMeta; lang?: "zh-TW" | "en"; jsonLd?: object | object[] }`。它算出 `routePath = toRoutePath(Astro.url.pathname)`，傳給 `Header`、`Footer`。`Head.astro` 依 `absoluteTitle` 決定要不要套用 title 模板，並輸出 OG／Twitter／alternate／geo 標籤。結構為 `<html lang>`、`Head`、Organization JSON-LD（從 `getOrganizationProfile()` 取得，失敗時用 `FALLBACK_ORGANIZATION_PROFILE`）、跳到主內容的連結、`Header`、`<main id="main-content" tabindex="-1" role="main">`、`<slot />`、`Footer`、`ScrollToTop`。
- `Header.astro`：導覽項目和英文版的導覽項目沿用舊 `NAV_ITEMS`／`EN_NAV_ITEMS`；目前頁面用 `isNavHrefActive(href, routePath)` 判斷並加上 `aria-current="page"`。下拉選單是按鈕加 `aria-expanded`、`aria-controls`；用一段 inline `<script>` 處理：點擊切換、按 Escape 關閉並把焦點還給按鈕、點外面關閉。手機選單也照這個模式。

- [ ] **Step 1: Write the failing check**：在 `index.astro` 改用 `BaseLayout` 之前，先修改 `check-a11y-static.mjs` 的路徑，然後執行。

Run: `npm run build && npm run check:a11y`
Expected: FAIL，原因包括 `skip-link: index.html missing skip-to-content link`，以及 focus-ring 的 CSS 檢查（暫時頁面還沒有載入全域 CSS）。

- [ ] **Step 2: Implement** 上述元件，並讓 `index.astro` 使用 `BaseLayout`。

- [ ] **Step 3: Verify**

Run: `npm run build && npm run check:a11y` → `All static accessibility checks passed.`
另外執行 `grep -o '<html lang="[^"]*"' dist/index.html`，結果應為 `lang="zh-TW"`；再執行 `grep -c 'aria-expanded="false"' dist/index.html`，結果至少等於下拉選單的數量。如果 Lightning CSS 把 `FOCUS_RULE`／`FOCUS_OFFSET` 壓縮成別的寫法，就調整 `check-a11y-static.mjs` 的比對方式，讓它比對語意，不比對逐字字串，並在 commit message 裡說明。

- [ ] **Step 4: Commit**

```bash
git add src/layouts src/components scripts/check-a11y-static.mjs src/pages/index.astro && git commit -m "feat: base layout with header, footer, skip link and metadata"
```

---

### Task 5: 文章相關頁面

**Files:**
- Create: `src/components/ArticleCard.astro`, `src/components/ArticleListing.astro`（空狀態與錯誤狀態沿用舊文字）, `src/components/PaginatedGrid.astro`（每頁筆數同舊 `PaginatedArticleGrid`）, `src/components/ArticleDetail.astro`, `src/components/ArticleAttachments.astro`, `src/components/PaginationControls.astro`
- Create pages: `src/pages/news.astro`, `src/pages/blog/[slug].astro`, `src/pages/notice/[slug].astro`, `src/pages/story.astro`, `src/pages/story/[slug].astro`, `src/pages/guides.astro`, `src/pages/guides/[slug].astro`, `src/pages/related-news.astro`, `src/pages/related-news/[slug].astro`
- Reference: `git show main:src/app/{news,blog,notice,story,guides,related-news}/...`, `main:src/components/{ArticleCard,ArticleListing,ArticleDetail,ArticleAttachments,PaginatedArticleGrid,PaginationControls}.tsx`

**Interfaces:**
- Consumes: `ARTICLE_SECTION_CONFIG`, `getListingLink`, `isNewsArticle`, `NEWS_LISTING`（`src/lib/article-sections.ts`）；`renderMarkdown`／`Markdown.astro`；`buildArticleMetadata`、`buildPageMetadata`；`getArticleSchema`。
- `getStaticPaths` 的規則（照 `main:src/app/blog/[slug]/page.tsx`）：
  - story 和 guides 只產生帶有對應 `categorySlug` 的文章；
  - blog 只產生**不屬於** story／guides 的 blog 文章，所以 `/blog/<story 文章>` 維持 404；
  - notice 和 related-news 產生全部。
- `ArticleDetail.astro` 的內容區加 `data-pagefind-body`，相關文章與返回連結加 `data-pagefind-ignore`。
- 新增 `scripts/check-build-coverage.mjs`，並在 Task 1 預留的 `build` script 串上它。它檢查兩件事，任一不符就 exit 1：
  - `dist/sitemap.xml` 裡的每個 `<loc>` 都要有對應的 `dist` 檔案。Task 8 之前先跳過 sitemap 這項。
  - 每個區段的詳細頁數量，要等於 `content-snapshots` 的列表數量減去被排除的文章數量。
- `PaginatedGrid`：伺服器端輸出全部卡片。inline script 依每頁筆數，用 `hidden` 屬性隱藏其他頁的卡片，讓輔助工具也不會讀到，並產生分頁按鈕；沒有 JavaScript 時顯示全部卡片。這會讓列表頁 `<main>` 的文字比現況多（現況只輸出第一頁），屬於預先核准的比對差異。

- [ ] **Step 1: Implement** 元件與頁面。

- [ ] **Step 2: Verify**：執行 `npm run build`，然後檢查：
  - `ls dist/news.html dist/blog/20260822-general-assembly-and-finance-lecture.html dist/story/document-694e4dd6.html dist/guides/document-25e793fb.html dist/related-news/related_news-979295e1.html` 全部存在；
  - `grep -c 'youtube-nocookie.com/embed/2A1ATKD-KBc' dist/blog/20260822-general-assembly-and-finance-lecture.html` → 1；
  - `grep -o 'href="/news"' dist/notice/20240111-first-committee.html | head -1` 有輸出（麵包屑）；
  - `ls dist/blog/document-694e4dd6.html` 不存在（story 文章不在 /blog 底下）；
  - `grep -c 'aria-current="page"' dist/story/document-694e4dd6.html` ≥ 1；
  - `npm run build` 的最後一段 `check:build-coverage` 通過；
  - `npm run check:a11y` 通過。

- [ ] **Step 3: Commit**

```bash
git add src && git commit -m "feat: article listings and detail pages"
```

---

### Task 6: 文件頁、創立目的、聯繫頁、CMS 頁面、404

**Files:**
- Create pages: `src/pages/document.astro`, `src/pages/document/[slug].astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/structure.astro`, `src/pages/logo-represent.astro`, `src/pages/faq.astro`, `src/pages/404.astro`
- Create: `src/components/DocumentList.astro`（每頁 10 筆、分類篩選，邏輯同舊 `PaginatedDocumentList`；篩選與分頁用 inline script）, `src/components/CmsPage.astro`（三個 CMS 頁面共用）
- Reference: `git show main:src/app/{document,about,contact,[pageSlug],not-found.tsx}`, `main:src/components/PaginatedDocumentList.tsx`

**Interfaces:**
- Consumes：`getDocumentUpdatedAt`, `findGovernanceDocuments`, `GOVERNANCE_DOCUMENTS`, `extractContactContent`, `DONATION_INFO`, `formatDonationAccount`, `getPhoneHref`, `formatPhoneForDisplay`, `getWebPageSchema`。
- `CmsPage.astro` props：`{ slug: "structure" | "logo_represent" | "faq"; path: string; fallbackTitle: string }`。

- [ ] **Step 1: Implement**

- [ ] **Step 2: Verify**：執行 `npm run build`，然後檢查：
  - `dist/{document,about,contact,structure,logo-represent,faq,404}.html` 全部存在；
  - `grep -o '<h1[^>]*>[^<]*' dist/about.html` 的結果包含 `創立目的`；
  - `grep -c '2026年10月22日' dist/about.html` → 0（文件日期改用版本上傳日）；
  - `dist/404.html` 包含 `href="/news"` 和 `href="/faq"`；
  - `npm run check:a11y` 通過。

- [ ] **Step 3: Commit**

```bash
git add src && git commit -m "feat: documents, about, contact, CMS pages and 404"
```

---

### Task 7: 首頁（含輪播）與英文頁

**Files:**
- Create: `src/pages/index.astro`（取代暫時的頁面）, `src/pages/en.astro`, `src/components/HeroSlider.astro`, `src/data/homepage.ts`（舊 `page.tsx` 裡的常數，包括 slides、features、documentary、partners，原文照搬）
- Reference: `git show main:src/app/page.tsx`, `main:src/app/en/page.tsx`, `main:src/components/HeroSlider.tsx`

**Interfaces:**
- `HeroSlider.astro`：
  - 用 CSS scroll-snap 做輪播；外層加上 `aria-roledescription="輪播"`（英文版用 `carousel`），aria-label 沿用舊文字。
  - 只有第一張的標題是 h1，其他用 h2。
  - 有上一張、下一張、暫停／播放按鈕；`prefers-reduced-motion: reduce` 時不自動播放。
  - 沒有 JavaScript 時可以手動捲動，第一張一定看得到。
- `en.astro` 用 `BaseLayout lang="en"`，內容沿用 `EN_COPY` 和中文 fallback 的規則（`getChineseStoryFallbackArticles`）。

- [ ] **Step 1: Implement**

- [ ] **Step 2: Verify**：執行 `npm run build`，然後檢查：
  - `grep -c '<h1' dist/index.html` → 1；
  - `grep -o '<html lang="[^"]*"' dist/en.html` → `lang="en"`；
  - `dist/index.html`、`dist/en.html` 的 `<title>` 和正式站逐字相同（`curl -s https://www.usher.org.tw/ | grep -o '<title>[^<]*'`，`/en` 也一樣比對）；
  - `dist/index.html` 包含 `即使這些人這些事`、`病友故事`、`聯繫我們`；
  - `dist/index.html` 裡 `line.me` 出現的次數為 3（與正式站相同，LINE 群組的能見度不變）；
  - `npm run check:a11y` 通過。

- [ ] **Step 3: Commit**

```bash
git add src && git commit -m "feat: homepage with scroll-snap hero slider and English entry"
```

---

### Task 8: 搜尋（Pagefind）、sitemap、robots

**Files:**
- Create: `src/components/SearchDialog.astro`（原生 `<dialog>`）, `src/lib/sitemap.ts`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`
- Test: `src/lib/sitemap.test.ts`
- Reference: `git show main:src/components/{SearchModal,SearchButton}.tsx`, `main:src/app/{sitemap,robots}.ts`

**Interfaces:**
- `SearchDialog.astro`：
  - 用 `⌘K`／`Ctrl+K` 和 Header 的搜尋按鈕開啟，按 Escape 關閉，關閉後焦點回到原本的按鈕；
  - 用 ``await import(/* @vite-ignore */ `${location.origin}/_pagefind/pagefind.js`)`` 載入。不能寫成字面路徑：Vite 在建置時會試著解析它，而那時 Pagefind 還沒產生檔案。搜尋結果的網址要去掉 `.html`，避免多一次轉址；
  - 快速導覽清單、搜尋中狀態、零結果文字都沿用舊 `navActions` 和舊的文案；
  - 結果清單可以用上下鍵移動、Enter 開啟。
- `buildSitemapEntries(input: { articles: Record<"blog"|"notice"|"related_news", ArticleSummary[]>; documents: PublicDocumentSummary[]; siteUrl: string }): SitemapEntry[]`、`renderSitemapXml(entries: SitemapEntry[]): string`；`SitemapEntry = { url: string; lastModified?: string; changeFrequency: string; priority: number; alternates?: Record<string, string> }`。`/` 和 `/en` 照現況輸出 `xhtml:link hreflang`。靜態清單與優先度照搬舊 `sitemap.ts`（包含 `/news`、`/faq`，不包含 `/blog`、`/notice`、`/message`）。

- [ ] **Step 1: Write the failing tests**

```ts
it("lists /news and /faq but not redirected paths", () => {
  const urls = buildSitemapEntries(fixture).map((e) => e.url);
  expect(urls).toContain("https://www.usher.org.tw/news"); expect(urls).toContain("https://www.usher.org.tw/faq");
  expect(urls).not.toContain("https://www.usher.org.tw/blog"); expect(urls).not.toContain("https://www.usher.org.tw/message"); });
it("puts story and guides articles under their section paths", () => {});
it("uses getDocumentUpdatedAt for document lastModified", () => {});
it("renders valid sitemap XML with escaped URLs", () => { expect(renderSitemapXml([{ url: "https://x/a?b&c", changeFrequency: "weekly", priority: 0.8 }])).toContain("a?b&amp;c"); });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/sitemap.test.ts`
Expected: FAIL，錯誤為找不到模組。

- [ ] **Step 3: Implement** 模組、endpoint、搜尋元件。

- [ ] **Step 4: Verify**

Run: `npx vitest run src/lib/sitemap.test.ts && npm run build`
Expected：測試 PASS；`dist/sitemap.xml`、`dist/robots.txt`（內容包含 `Disallow: /api/` 和 sitemap 網址）、`dist/_pagefind/pagefind.js` 都存在。

- [ ] **Step 5: Commit**

```bash
git add src && git commit -m "feat: pagefind search dialog, sitemap and robots"
```

---

### Task 9: 新舊網站逐頁比對工具

**Files:**
- Create: `src/lib/parity.ts`, `scripts/check-parity.mjs`（Node 24 預設可以直接 import `.ts`；package script 為 `check:parity`）
- Test: `src/lib/parity.test.ts`

**Interfaces:**
- `extractPageFacts(html: string): { title: string; h1: string; canonical: string; text: string }`：`text` 是 `<main>` 內的文字，去掉標籤、`<script>`、`<style>`，空白壓縮成一個空格。
- `compareFacts(a: PageFacts, b: PageFacts): string[]`：回傳差異說明；`text` 不同時附上第一個不同處前後各 40 字。
- `check:parity <oldBase> <newBase>`：網址清單取自舊站的 `/sitemap.xml`，加上五條轉址的來源，再加上 `/news/`、`/About`、`/blog/20240406-usher-working-group.html`、`/blog/document-694e4dd6` 與一個不存在的網址。每個網址都以 `redirect: "manual"` 請求，比對狀態碼、`location`（正規化成路徑）與頁面摘要。環境變數 `VERCEL_AUTOMATION_BYPASS_SECRET` 有值時，對新站的請求要帶 `x-vercel-protection-bypass` 標頭，否則預覽部署會回傳 401。輸出表格，有差異時以 exit 1 結束。

- [ ] **Step 1: Write the failing tests**

```ts
it("extracts title, h1, canonical and main text", () => {
  const f = extractPageFacts('<title>常見問題 | 台灣尤塞氏症暨視聽弱協會</title><link rel="canonical" href="https://www.usher.org.tw/faq"><main><h1>常見問題</h1><p>a  b</p><script>x</script></main>');
  expect(f).toEqual({ title: "常見問題 | 台灣尤塞氏症暨視聽弱協會", h1: "常見問題", canonical: "https://www.usher.org.tw/faq", text: "常見問題 a b" }); });
it("reports no differences for equal facts", () => { expect(compareFacts(f, { ...f })).toEqual([]); });
it("reports a text difference with context", () => { expect(compareFacts(f, { ...f, text: "常見問題 a c" })[0]).toMatch(/text/); });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/parity.test.ts` → FAIL（module not found）

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/parity.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/parity.ts src/lib/parity.test.ts scripts/check-parity.mjs package.json && git commit -m "feat: page-by-page parity checker for the migration"
```

---

### Task 10: 快照腳本、CI、文件、預覽部署與比對

**Files:**
- Modify: `scripts/snapshot-content.mjs`（讀取 `CMS_API_URL`／`SNAPSHOT_API_URL`，並帶上 `X-Site-Build-Token`）, `.github/workflows/ci.yml`（環境變數改名、`build` 後執行 `check:a11y`）, `CLAUDE.md`, `README.md`, `docs/DEVELOPMENT.md`, `.env.example`（如果存在）

- [ ] **Step 1: 合併 `main`**：`git merge main`，把改寫期間後台自動推送到 `main` 的資產帶進分支。

- [ ] **Step 2: 本機全套驗證**

Run: `npm run test && npm run lint && CMS_API_URL=https://member.usher.org.tw/api/v1 SITE_BUILD_TOKEN=<token> npm run build && npm run check:a11y && npm run check:content && npm run check:assets && CONTENT_SOURCE=snapshot npm run build`
Expected：全部 exit 0；`grep -rl "<token>" dist` 沒有任何結果，確認 token 沒有洩漏到輸出檔。

- [ ] **Step 3: 更新文件**：修改 `CLAUDE.md`、`README.md`、`docs/DEVELOPMENT.md` 的 Commands、Tech Stack、Architecture、Route Structure、Key Files、Components、環境變數。移除 ISR、revalidate、`next dev` 的說明，改寫成「發布後整站重建，透過 Deploy Hook」。

- [ ] **Step 4: Commit 並推送分支**

```bash
git add -A && git commit -m "docs: update project docs for the Astro architecture"
git push -u origin astro-migration
```

- [ ] **Step 5: Vercel 預覽**
  - 在 Vercel 專案**新增** Preview 與 Production 環境變數 `CMS_API_URL`、`SITE_URL`、`SITE_BUILD_TOKEN`（值取自 CMS 計畫 Task 5）。不刪除既有的 `NEXT_PUBLIC_*`、`REVALIDATE_TOKEN`，回滾時還會用到。
  - **不修改**專案的 Build & Output 設定，分支靠 `vercel.json` 覆寫。
  - 確認 Vercel 已開啟建置失敗的 email 通知。
  - 為 `astro-migration` 分支建立一個 Deploy Hook，用 `curl -X POST` 呼叫，確認會產生新的預覽部署，而且建置紀錄裡沒有任何 429。
  - 如果預覽部署開啟了 Deployment Protection，就取得 Protection Bypass for Automation secret，供 Task 9 的比對工具和 Lighthouse 使用。
  - **如果無法用 Vercel CLI 或 API 完成以上設定，停下來請秘書長在 Vercel 後台操作，並逐項提供要填的值。**
  - Expected：分支的預覽網址可以打開。

- [ ] **Step 6: 逐頁比對**

Run: `npm run check:parity https://www.usher.org.tw <preview-url>`
Expected：沒有任何狀態碼或轉址的差異。其餘差異要逐條列出，並寫明每一條為什麼屬於 spec §4.1 允許的範圍，例如輪播標記改變；無法說明的差異就修到消失。

- [ ] **Step 7: Lighthouse**：在手機模式下量測首頁、`/story/document-694e4dd6`、`/faq` 的新舊版本，把 JavaScript 傳輸量和效能分數記在 `docs/superpowers/specs/2026-10-22-astro-migration-design.md` 最後新增的「量測結果」一節。

---

### Task 11: 切換上線

**這一步會改變正式站：開始之前先把 Task 10 的比對結果和 Lighthouse 數據交給秘書長，等確認後才執行。**

- [ ] **Step 1: 建立 Deploy Hook**：在 Vercel 建立 `main` 分支的 Deploy Hook，並設定 Production 環境變數（與 Task 10 Step 5 相同）。

- [ ] **Step 2: 合併上線**：先 `git checkout main && git merge --no-ff astro-migration && git push origin main`，再等 Vercel 正式部署完成。

- [ ] **Step 3: 正式站比對**：用最近一次 Next.js 正式部署的網址當作舊站，執行 `npm run check:parity <最近一次 Next.js 部署的網址> https://www.usher.org.tw`，結果要和 Task 10 Step 6 相同。

- [ ] **Step 4: 切換後台**（Step 2 合併之後應盡快完成：從合併到這一步之間，後台仍會呼叫已經不存在的 `/api/revalidate`。這段期間的呼叫只會在後台日誌留下 warning，不影響正式站，但內容更新要等這一步完成後才會生效。）
  - 在 armub `.env` 設定 `SITE_DEPLOY_HOOK_URL=<hook>` 和 `SITE_UPDATE_MODE=deploy_hook`，然後執行 `docker compose up -d --force-recreate app`。執行前先跑 `scripts/backup-armub-sqlite.sh pre-site-cutover`。
  - 執行 `docker compose exec app php artisan site:rebuild`，輸出應為 `Site rebuild queued.`。

- [ ] **Step 5: 端對端測試**：在後台把 `faq` 頁面原樣重新儲存一次。約 60 秒後 Vercel 應出現新的部署，部署完成後正式站內容不變，而且 `docker compose logs app` 裡有 `Site rebuild triggered`。

- [ ] **Step 6: 回報**：向秘書長回報結果，並提醒：
  - 舊的 revalidate 程式碼和 `NEXTJS_REVALIDATE_*` 設定至少保留兩週；
  - 回滾方法見 spec §4.5。緊急回滾時，必須同時把後台的 `NEXTJS_AUTOPUSH_ASSETS` 改成 `false`，否則下一次圖片上傳就會把 Astro 版本重新部署回正式站。
