# 網站內容減法整理與常見問題頁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the site navigation, merge 事務公告＋部落格 into one 活動與公告 listing, add a CMS-backed 常見問題 page, publish the 2026 會員大會 video article, and clean up duplicated CMS categories and broken welfare links.

**Architecture:** CMS content is written first on production (`armub`, Laravel in Docker, SQLite) through `artisan tinker` using Eloquent plus explicit `SiteRevalidationService` calls, so the Next.js build can find every page the new navigation links to. Front-end changes reuse the existing section config (`ARTICLE_SECTION_CONFIG`), `[pageSlug]` CMS page route, and `MarkdownRenderer`; no new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, react-markdown + remark-gfm, Vitest; Laravel 10 CMS (`~/Project/usher/usher-manage-stack`).

**Spec:** `docs/superpowers/specs/2026-10-22-content-restructure-design.md`

## Global Constraints

- LINE 群組的能見度不變：不在首頁、導覽列、FAQ 頂部新增任何群組入口或按鈕；FAQ 內「LINE 社群」連到 `/contact`，不放邀請連結。
- FAQ 不得出現【待補】、【待確認】、「即將推出」等佔位文字，也不得出現來源文章以外的醫療斷言。
- 既有網址不可失效：`/blog/*`、`/notice/*` 詳細頁網址不變；`/blog`、`/notice`、`/message` 列表／頁面改為永久轉址。
- 不加 `searchParams` 到列表頁；不改 Laravel port（本機 8001）；`categories?.length` 等用選擇性鏈結。
- CMS 正式環境寫入：每批之前執行 `scripts/backup-armub-sqlite.sh <label>`（在 `usher-manage-stack` 本機執行），透過 `ssh armub` → `cd /home/gbanyan/docker/usher-manage-stack && docker compose exec app php artisan tinker` 以 Eloquent 寫入；不寫原生 SQL；寫入後手動呼叫 `App\Services\SiteRevalidationService::revalidateArticle($slug)` / `revalidatePage($slug)`（後台 controller 才會自動呼叫，tinker 不會）。
- 社會福利資源的新連結清單**必須先給秘書長確認**才能寫入正式環境。
- 英文版 `/en` 與 `EN_NAV_ITEMS` 不動。
- 驗證指令：`npm run lint`、`npm run test`、`npm run build`、`npm run check:a11y`、`npm run check:content`、`npm run check:assets`。
- 本計畫所有 `npm run build` 都以正式 CMS 為內容來源：在指令前加上 `NEXT_PUBLIC_API_URL=https://member.usher.org.tw/api/v1`（`.env.local` 指向本機 8001，那裡沒有 Task 1 建立的內容）。下文寫 `npm run build` 時，一律代表這個形式。

## Review Focus

- 舊連結：有人從 LINE 或 Facebook 點進 `/notice`、`/blog`、`/message` → 應 308 轉到 `/news`、`/news`、`/about`，而不是 404。（Task 4、Task 5 的 build 後 curl 檢查。）
- 文章詳細頁的麵包屑和「返回列表」按鈕：從 `/blog/<slug>`、`/notice/<slug>` 點回列表，應直接到 `/news`，不要多經過一次轉址。（Task 4 單元測試）
- YouTube 連結出現在句子中間，或連結文字不是網址：應維持一般連結，不要被換成播放器。只有「整段只有一個 YouTube 連結」的段落才嵌入。（Task 6 單元測試）
- 在 snapshot 模式（CI）建置時，`/faq` 必須有快照，否則 CI 會建出 404。（Task 7 跑完 refresh:content 後 `ls content-snapshots/pages/faq.json`）
- 合併分類時漏掉文章：合併後每篇原本掛在重複分類下的文章，仍要恰好掛在一個合併後的分類上。（Task 2 的前後計數核對）

---

### Task 1: CMS — 新增 FAQ 頁面與 2026 會員大會文章

**Files:**
- 正式 CMS 資料（`armub`）：`pages` 新增 slug `faq`；`articles` 新增一篇 blog。
- 參考：`~/Project/usher/usher-manage-stack/app/Models/Page.php`、`app/Models/Article.php`、`app/Http/Controllers/Admin/PageController.php:60-90`、`ArticleController.php:120-165`（看 store 時設定了哪些欄位，例如 `status`、`published_at`、`created_by_user_id`、`content_type`），照同樣欄位用 Eloquent 建立。

**Interfaces:**
- Produces: `GET https://member.usher.org.tw/api/v1/pages/faq` 回傳 `{ data: { title: "常見問題", content, ... } }`；新文章 slug `20260822-general-assembly-and-finance-lecture`，出現在 `GET /api/v1/articles?type=blog`。

- [ ] **Step 1: 備份**

Run（在 `~/Project/usher/usher-manage-stack`）：`scripts/backup-armub-sqlite.sh pre-content-restructure-faq`
Expected: 輸出備份檔路徑，結尾為 `database.sqlite.pre-content-restructure-faq-<timestamp>`。

- [ ] **Step 2: 準備 FAQ Markdown**

內容是 spec 附錄 A 的全文，並做以下調整：
- 頁首免責說明使用 `>` 引用。
- 三個分組使用 `## 認識尤塞氏症`、`## 生活與福利`、`## 關於協會`。
- 每題使用 `### 什麼是尤塞氏症？` 這類標題，不加「Q.」。
- 每個「→〈…〉」改成 Markdown 連結，網址對照：
  - 〈什麼是尤塞氏症？〉→ `/guides/document-25e793fb`
  - 〈眼科醫師觀點〉→ `/guides/document-b81734e3`
  - 〈視聽障礙疾病之遺傳學〉→ `/document/8c4f66e6-2dd2-4488-915f-d4302259312e`
  - 〈社會福利資源〉→ `/document/eb26ba18-4cc5-524e-ba8e-98d6a4ee6782`
  - 輔具倡議 → `/notice/20260204-mohw-assistive-device-proposal-summary`
  - 〈聯繫資訊〉→ `/contact`
  - 「活動與公告」→ `/news`
- 寫入前，先用 `curl -sI https://www.usher.org.tw<path>` 確認每個站內路徑目前回傳 200（`/news` 例外，Task 4 才會建立）。

完成後，用 grep 確認內容裡沒有 `待補`、`待確認`、`line.me`。

- [ ] **Step 3: 在 tinker 建立頁面並觸發 revalidation**

Create `Page` with `slug="faq"`, `title="常見問題"`, `meta_description="尤塞氏症與協會的常見問題：疾病介紹、類型、遺傳、檢查、治療、福利補助與協會活動。"`, status published (use the same value PageController uses). Then call `SiteRevalidationService::revalidatePage('faq')`.

- [ ] **Step 4: 建立會員大會文章**

Create `Article`:
- `content_type="blog"`, `slug="20260822-general-assembly-and-finance-lecture"`, `title="2026-08-22 會員大會暨理財講座｜活動紀錄"`, `published_at="2026-08-22 18:00:00"`，status published.
- 附加分類「協會活動」（`category-306`；Task 2 合併分類時不動它）。
- 正文只寫以下內容：
  - 時間：2026-08-22（六）10:00–16:30
  - 主辦：台灣尤塞氏症暨視聽弱協會
  - 場地贊助：科懋生物科技股份有限公司
  - 協辦：慈濟大學分子生物暨人類遺傳學系
  - 一句「本次活動包含會員大會與理財講座，完整直播紀錄如下。」
  - 單獨一段只放 `https://www.youtube.com/watch?v=2A1ATKD-KBc`（Task 6 會把這種段落轉成嵌入播放器）
  - 一句「影片目前沒有字幕。」

建立後呼叫 `revalidateArticle` 觸發 revalidation。

- [ ] **Step 5: 驗證公開 API**

Run: `curl -s https://member.usher.org.tw/api/v1/pages/faq | python3 -c "import json,sys;d=json.load(sys.stdin)['data'];print(d['title'])"` → `常見問題`
Run: `curl -s "https://member.usher.org.tw/api/v1/articles/20260822-general-assembly-and-finance-lecture" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['title'])"` → 文章標題

---

### Task 2: CMS — 合併重複分類

**Files:** 正式 CMS 資料：`article_categories`、`article_category` pivot。

**Interfaces:**
- Produces: 每個分類名稱只剩一個分類：「協會事務」slug 為 `association-affairs`，「相關報導」slug 為 `related-news`。`story`、`guides`、`document`、`category-306`（協會活動）不動。

- [ ] **Step 1: 備份並列出現況**

Run: `scripts/backup-armub-sqlite.sh pre-category-merge`

在 tinker 印出每個 `ArticleCategory` 的 `id, slug, name, articles()->count()`，並各自記錄名稱為「協會事務」和「相關報導」的分類：
- 分類 id 清單
- 底下文章 id 的聯集
- 聯集的大小 N

Expected：「協會事務」有 8 個分類 slug（`category-423/248/271/205/785/943/336/148`），「相關報導」有 7 個（`category-497/949/612/532/211/995/334`）。如果實際數量不同，以實際資料為準，並在回報中註明。

- [ ] **Step 2: 合併**

每個名稱各做一次：
1. 保留 id 最小的那個分類，把 slug 改成 `association-affairs` 或 `related-news`。
2. 對聯集裡的每篇文章，用 `categories()->syncWithoutDetaching([$keepId])` 掛上保留的分類，再 `detach` 掉其他重複分類。
3. 刪除已經沒有文章的重複分類。
4. 對每篇受影響的文章呼叫 `revalidateArticle($slug)`。

- [ ] **Step 3: 核對**

在 tinker 確認以下三點：
- 每個名稱只剩一個分類。
- 這個分類的 `articles()->count()` 等於 N。
- 聯集裡沒有任何一篇文章失去分類，也就是每篇的 `categories()->count() >= 1`。

再執行 `curl -s https://member.usher.org.tw/api/v1/categories`，確認輸出裡只剩一筆「協會事務」和一筆「相關報導」。

---

### Task 3: CMS — 修正〈社會福利資源〉連結（有核可關卡）

**Files:**
- 文章 `document-d34b35ab`（`content` Markdown）。
- 公開文件 `eb26ba18-4cc5-524e-ba8e-98d6a4ee6782`。它的現行版本是上傳的 `document-d34b35ab.md`，新版本照 `DocumentController` 的上傳新版本流程或對應 service 建立，讓 `DocumentObserver` 觸發 revalidation。

- [ ] **Step 1: 找出替換連結**

需要替換的三項目前都指向 `https://www.nhi.gov.tw/ch/mp-1.html`：
- 「重大傷病卡申請」：改用健保署的重大傷病專區。
- 「身心障礙鑑定需求評估及證明核發」：改用衛福部社家署對應的頁面。
- 「身心障礙者福利措施」：改用衛福部社家署對應的頁面。

每個候選網址都用 `curl -sIL -m 15 <url>` 確認最後回傳 200。

- [ ] **Step 2: 停下來給秘書長確認**

把「項目｜舊網址｜新網址｜curl 結果」整理成表格交給秘書長，**等秘書長回覆核可後才繼續**。秘書長修改的部分照修改內容執行。

- [ ] **Step 3: 寫入**

1. 執行 `scripts/backup-armub-sqlite.sh pre-welfare-links`。
2. 更新文章 content，呼叫 `revalidateArticle('document-d34b35ab')`。
3. 用修正後的同一份 Markdown 為公開文件上傳新版本。

- [ ] **Step 4: 核對**

Run: `curl -s https://member.usher.org.tw/api/v1/articles/document-d34b35ab | grep -c "nhi.gov.tw/ch/mp-1.html"` → `0`
公開文件的 `current_version` 版本號比原本多 1。

---

### Task 4: 「活動與公告」合併列表 `/news`

**Files:**
- Modify: `src/lib/article-sections.ts`（新增 listing 設定與 `isNewsArticle`）
- Create: `src/lib/article-sections.test.ts`
- Create: `src/app/news/page.tsx`
- Modify: `src/app/blog/page.tsx`、`src/app/notice/page.tsx`（改成 `permanentRedirect("/news")`，照 `src/app/research/page.tsx` 的寫法）
- Modify: `src/components/ArticleDetail.tsx:52-60,154`（麵包屑和返回連結改用 listing）

**Interfaces:**
- Produces:
  - `ArticleSectionConfig.listing?: { label: string; path: string }`：blog 和 notice 都設成 `{ label: "活動與公告", path: "/news" }`。
  - `export const NEWS_LISTING = { label: "活動與公告", path: "/news", description: "協會活動紀錄、會務公告與倡議進度" }`。
  - `export function getListingLink(config: ArticleSectionConfig): { label: string; path: string }`：有 `listing` 時回傳 `listing`，否則回傳 `{ label, path }`。
  - `export function isNewsArticle(article: Pick<ArticleSummary, "content_type" | "categories">): boolean`：notice 一律是 true；blog 只有在不含 `story`、`guides` 分類時為 true；其他類型為 false。
- `config.path` 不變（`/blog`、`/notice`），詳細頁的 canonical URL 照舊。

- [ ] **Step 1: 寫失敗測試** `src/lib/article-sections.test.ts`

```ts
describe("getListingLink", () => {
  it("sends blog and notice back to the merged news listing", () => {
    expect(getListingLink(ARTICLE_SECTION_CONFIG.blog)).toEqual({ label: "活動與公告", path: "/news" });
    expect(getListingLink(ARTICLE_SECTION_CONFIG.notice)).toEqual({ label: "活動與公告", path: "/news" });
  });
  it("keeps other sections on their own listing", () => {
    expect(getListingLink(ARTICLE_SECTION_CONFIG.story)).toEqual({ label: "病友故事", path: "/story" });
    expect(getListingLink(ARTICLE_SECTION_CONFIG.related_news)).toEqual({ label: "相關報導", path: "/related-news" });
  });
  it("does not change detail paths", () => {
    expect(ARTICLE_SECTION_CONFIG.blog.path).toBe("/blog");
    expect(ARTICLE_SECTION_CONFIG.notice.path).toBe("/notice");
  });
});
describe("isNewsArticle", () => {
  const cat = (slug: string) => ({ id: 1, name: slug, slug });
  it("includes every notice", () => expect(isNewsArticle({ content_type: "notice", categories: [cat("story")] })).toBe(true));
  it("includes plain blog posts", () => expect(isNewsArticle({ content_type: "blog", categories: [cat("category-306")] })).toBe(true));
  it("includes blog posts without categories", () => expect(isNewsArticle({ content_type: "blog" })).toBe(true));
  it("excludes story and guides blog posts", () => {
    expect(isNewsArticle({ content_type: "blog", categories: [cat("story")] })).toBe(false);
    expect(isNewsArticle({ content_type: "blog", categories: [cat("guides")] })).toBe(false);
  });
  it("excludes related news", () => expect(isNewsArticle({ content_type: "related_news" })).toBe(false));
});
```

（`cat` 的物件形狀要對齊 `src/lib/types.ts` 的分類型別；欄位不同就照型別調整。）

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/lib/article-sections.test.ts`
Expected: FAIL，錯誤為 `getListingLink`／`isNewsArticle` 沒有匯出。

- [ ] **Step 3: 實作** `article-sections.ts` 的新匯出，並把 blog、notice 的 `listing` 設成 `NEWS_LISTING` 的 label 和 path。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/lib/article-sections.test.ts` → PASS

- [ ] **Step 5: 建立 `/news` 頁面並改寫 blog、notice 列表**

`src/app/news/page.tsx`：
- 用 `Promise.all` 同時取 `getAllArticles({ type: "blog" })` 和 `getAllArticles({ type: "notice" })`；任一個失敗就視為錯誤狀態（`isError`），呈現方式照 `blog/page.tsx`。
- 合併後用 `isNewsArticle` 過濾，依 `published_at` 由新到舊排序。
- 交給 `ArticleListing`，`emptyText="目前沒有活動與公告"`、`errorText="活動與公告暫時無法載入"`。
- metadata 用 `buildPageMetadata(NEWS_LISTING.label, NEWS_LISTING.description, NEWS_LISTING.path)`。

`ArticleCard` 會依 `content_type` 產生詳細頁連結，不需要另外傳 `basePath`。實作前先讀 `ArticleCard.tsx:70-110` 確認這一點。

把 `blog/page.tsx`、`notice/page.tsx` 改成永久轉址到 `/news`；`ArticleDetail.tsx` 的麵包屑和「返回列表」改用 `getListingLink(config)`。

- [ ] **Step 6: 建置並檢查轉址**

Run: `npm run lint && npm run test && npm run build`，然後執行 `npm run start &` 並跑以下檢查：
- `curl -sI localhost:3000/blog | head -3` → 308，`location: /news`
- `curl -sI localhost:3000/notice | head -3` → 308，`location: /news`
- `curl -s localhost:3000/news | grep -c "會後回顧"` → ≥ 1
- `curl -s localhost:3000/news | grep -c "病友經驗分享"` → 0
- `curl -s localhost:3000/notice/20240111-first-committee | grep -o 'href="/news"' | head -1` → 有輸出

檢查完停掉 server。

- [ ] **Step 7: Commit**

```bash
git add src/lib/article-sections.ts src/lib/article-sections.test.ts src/app/news src/app/blog/page.tsx src/app/notice/page.tsx src/components/ArticleDetail.tsx
git commit -m "feat: merge notice and blog listings into /news"
```

---

### Task 5: 導覽減法、FAQ 路由、`/message` 轉址與連結同步

**Files:**
- Modify: `src/components/Header.tsx:30-59`（`NAV_ITEMS`）
- Modify: `src/app/[pageSlug]/page.tsx:8-19`（`PAGE_ROUTES`、`generateStaticParams`）
- Modify: `src/components/Footer.tsx:4-29`（快速連結）
- Modify: `src/components/SearchModal.tsx:170-185`（快速導覽）
- Modify: `src/app/page.tsx:361`（首頁「最新消息」連結 `/blog` → `/news`）
- Modify: `src/app/sitemap.ts:12-25`
- Modify: `scripts/snapshot-content.mjs:11-15`（加 `{ file: "faq", apiSlug: "faq" }`；移除 message）
- Modify: `scripts/check-a11y-static.mjs`（如果裡面列出的路由含 `/blog`、`/notice`、`/message`，改成 `/news`、`/faq`）

**Interfaces:**
- Consumes: Task 4 的 `NEWS_LISTING`；Task 1 的 CMS 頁面 `faq`。

- [ ] **Step 1: 改 `NAV_ITEMS`**

```
關於協會：創立目的 /about・組織架構 /structure・Logo象徵 /logo-represent
資源中心：協會文件 /document・建議與指引 /guides・病友故事 /story・常見問題 /faq
最新消息：活動與公告 /news・相關報導 /related-news
聯繫資訊 /contact
```

頂層不再有 `related-news` 項。`NavIconType` 裡沒用到的成員要一併移除。

- [ ] **Step 2: 調整 `[pageSlug]` 路由**

- `PAGE_ROUTES` 加上 `faq: { title: "常見問題", apiSlug: "faq" }`。
- `message` 改成永久轉址：在 `StaticPage` 裡，`pageSlug === "message"` 時呼叫 `permanentRedirect("/about")`，寫法同既有的 `logo_represent`。
- `generateStaticParams` 改為 `["structure", "message", "logo-represent", "faq"]`。保留 `message`，才能產生轉址。
- `message` 的 metadata 不再需要讀 CMS。

- [ ] **Step 3: Footer、SearchModal、首頁、sitemap**

- **Footer 快速連結**：「事務公告」「部落格」兩項合併成一項 `{ label: "活動與公告", href: "/news", icon: "notice" }`，另外加上 `{ label: "常見問題", href: "/faq", icon: "document" }`。社群連結（LINE、Facebook）完全不動。
- **SearchModal 快速導覽**：「部落格」「事務公告」改成一項 `{ id: "news", title: "活動與公告", url: "/news" }`，並加上 `{ id: "faq", title: "常見問題", url: "/faq" }`。
- **首頁**：「最新消息」的「查看全部」連到 `/news`。
- **sitemap**：靜態清單移除 `/blog`、`/notice`、`/message`，加上 `/news`（0.8，weekly）和 `/faq`（0.7，monthly）。文章詳細頁的 URL 產生邏輯不動。

- [ ] **Step 4: 建置並核對**

Run: `npm run lint && npm run test && npm run build && npm run check:a11y`，然後執行 `npm run start &` 並跑以下檢查：
- `curl -sI localhost:3000/message | head -3` → 308，`location: /about`
- `curl -s localhost:3000/faq | grep -c "什麼是尤塞氏症"` → ≥ 1
- `curl -s localhost:3000/faq | grep -c "line.me"` → 0
- `curl -s localhost:3000/ | grep -c "理事長的話"` → 0
- `curl -s localhost:3000/ | grep -o 'line.me' | wc -l`：結果要和改動前在 `main` 上量到的數字相同（先在 `main` 建置量一次，記下來），確保 LINE 的能見度沒有改變。

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/components/SearchModal.tsx "src/app/[pageSlug]/page.tsx" src/app/page.tsx src/app/sitemap.ts scripts/snapshot-content.mjs scripts/check-a11y-static.mjs
git commit -m "feat: trim navigation, add FAQ route and redirect /message"
```

---

### Task 6: 段落中的 YouTube 連結轉成嵌入播放器

**Files:**
- Modify: `src/lib/utils.ts`（新增 `getYouTubeVideoId`）
- Modify: `src/lib/utils.test.ts`
- Modify: `src/components/MarkdownRenderer.tsx`（新增 `p` component）

**Interfaces:**
- Produces: `export function getYouTubeVideoId(href: string): string | null`。可以辨識 `youtube.com/watch?v=ID`、`youtu.be/ID`、`youtube.com/live/ID`、`m.youtube.com/watch?v=ID` 和 `www.` 變體。ID 必須符合 `/^[\w-]{11}$/`，其他情況一律回傳 `null`。

- [ ] **Step 1: 寫失敗測試**（加到 `utils.test.ts`）

```ts
describe("getYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://youtube.com/watch?v=2A1ATKD-KBc&t=30s", "2A1ATKD-KBc"],
    ["https://m.youtube.com/watch?v=2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://youtu.be/2A1ATKD-KBc", "2A1ATKD-KBc"],
    ["https://www.youtube.com/live/2A1ATKD-KBc?si=x", "2A1ATKD-KBc"],
  ])("extracts the id from %s", (href, id) => expect(getYouTubeVideoId(href)).toBe(id));
  it.each([
    "https://www.youtube.com/@台灣尤塞氏症暨視聽弱",
    "https://www.youtube.com/watch?v=short",
    "https://example.com/watch?v=2A1ATKD-KBc",
    "not a url",
  ])("returns null for %s", (href) => expect(getYouTubeVideoId(href)).toBeNull());
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/lib/utils.test.ts` → FAIL，錯誤為 `getYouTubeVideoId` 沒有匯出。

- [ ] **Step 3: 實作** `getYouTubeVideoId`，用 `new URL()` 解析，並用 try/catch 包住。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/lib/utils.test.ts` → PASS

- [ ] **Step 5: 在 `MarkdownRenderer` 加 `p` component**

觸發條件：hast `node` 的子節點去掉純空白文字後，剛好只剩一個 `a` 元素，而且 `getYouTubeVideoId(href)` 回傳非 null。符合時改成渲染 `<figure className="my-6">`，裡面有：
- 16:9 容器（`aspect-video w-full overflow-hidden rounded-lg`），內放 `<iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="YouTube 影片播放器" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />`。
- `<figcaption>`：放原本的外部連結「在 YouTube 觀看」，連到原 `href`，沿用既有 `a` 的新視窗與 sr-only 提示。

不符合條件時照原樣渲染 `<p>`。記得把 `node` 從 props 裡拿掉，不要傳到 DOM，寫法同 `ShiftedHeading`。

- [ ] **Step 6: 建置並核對**

Run: `npm run lint && npm run build && npm run check:a11y`，然後檢查：
- `curl -s localhost:3000/blog/20260822-general-assembly-and-finance-lecture | grep -c "youtube-nocookie.com/embed/2A1ATKD-KBc"` → 1
- 同一頁 `grep -c "在 YouTube 觀看"` → 1

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils.ts src/lib/utils.test.ts src/components/MarkdownRenderer.tsx
git commit -m "feat: embed standalone YouTube links in markdown content"
```

---

### Task 7: 快照、文件、上線與正式站核對

**Files:**
- Modify: `content-snapshots/**`（refresh 產生）
- Modify: `CLAUDE.md`
- Modify: `.gitignore`（加 `.superpowers/`）
- Modify: `docs/site-content-review-2026.md`（「會議結論欄」下面加一行，記錄 2026-10-22 的決策，並連到 spec）

- [ ] **Step 1: 更新快照**

Run: `SNAPSHOT_API_URL=https://member.usher.org.tw/api/v1 npm run refresh:content`
Expected：三個步驟都 exit 0，而且 `content-snapshots/pages/faq.json` 存在。

- [ ] **Step 2: 更新 CLAUDE.md**

- **Route Structure 表格**：
  - 新增 `/news`（Static，活動與公告：notice＋非 story/guides 的 blog）和 `/faq`。
  - `/blog`、`/notice` 列表標註為「Permanent redirect to `/news`（detail pages unchanged）」。
  - `/[pageSlug]` 的說明改成 structure、logo-represent、faq；`message` 轉到 `/about`。
- **Markdown 說明**：改成 `react-markdown` + `remark-gfm`，並註明沒有使用 `rehype-raw`、原始 HTML 不會被渲染、整段只有一個 YouTube 連結的段落會變成嵌入播放器。
- **Content Sections 表格**：加上 `/news`。

- [ ] **Step 3: 全套驗證**

Run: `npm run lint && npm run test && npm run build && npm run check:a11y && npm run check:content && npm run check:assets`，全部都要 exit 0。

另外用 snapshot 模式再建置一次（`CONTENT_SOURCE=snapshot npm run build`），確認 `/faq` 和 `/news` 在 CI 的條件下也能建出來。

- [ ] **Step 4: Commit 並推送**

```bash
git add content-snapshots CLAUDE.md .gitignore docs/site-content-review-2026.md
git commit -m "chore: refresh snapshots and document content restructure"
git push origin main
```

- [ ] **Step 5: 核對正式站**

等 Vercel 部署完成（大約幾分鐘，用 `curl -sI https://www.usher.org.tw/news` 回傳 200 判斷），然後檢查：
- `/blog`、`/notice` → 308 轉到 `/news`
- `/message` → 308 轉到 `/about`
- `/faq` → 200
- `/blog/20260822-general-assembly-and-finance-lecture` 頁面裡有 `youtube-nocookie`
- `/blog/20240406-usher-working-group` → 200

把任何失敗的項目照實回報。
