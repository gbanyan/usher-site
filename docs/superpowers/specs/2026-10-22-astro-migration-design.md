# 網站改寫為 Astro — 設計文件

日期：2026-10-22
狀態：秘書長已核可（2026-10-22）

## 1. 背景與動機

協會網站目前用 Next.js 16（App Router）做成「靜態優先＋隨需重新驗證」的網站。秘書長認為 Next.js 帶進了這個網站用不到的架構複雜度，希望改寫成 Astro 來降低維護負擔。

Next.js 在這個網站帶來、但實際用不到的複雜度：

- 伺服器元件和瀏覽器元件的分界：13 個檔案標了 `"use client"`。例如 `MarkdownRenderer` 被標在瀏覽器執行，每篇文章頁都把整套 Markdown 解析器送進瀏覽器。
- 快取與更新機制：fetch 快取、快取標籤、`revalidate: false`、`/api/revalidate` webhook、`REVALIDATE_TOKEN`。2026-10-22 就發生過一次：本機建置沿用了舊的 fetch 快取，產生出舊內容的頁面。
- 頁面資料重複：每個頁面的 HTML 裡都附了一份 RSC payload，首頁 HTML 因此有 117 KB。
- 需要記住的規則：例如列表頁不能使用 `searchParams`。轉址要靠空的 page 檔，而且這些檔案還得從無障礙檢查中排除。

改寫前在正式站量到的數據（壓縮後的傳輸量）：首頁的 JavaScript 約 219 KB（10 個檔案），HTML 117 KB；病友故事單篇和常見問題頁的 JavaScript 各約 239 KB（12 個檔案）。

## 2. 目標、非目標、反目標

### 目標

- 把網站改寫成 **Astro 的純靜態輸出**，拿掉執行期的伺服器邏輯和 Next.js 特有的快取機制。
- 對訪客來說**網址、內容與功能完全不變**：每個現有網址都回傳相同內容，或照現有規則轉址。
- 內容更新改成「**後台發布 → 觸發整站重建**」。秘書長已確認，發布後一到兩分鐘才上線可以接受。
- 文字頁（文章、FAQ）送進瀏覽器的 JavaScript 明顯變少。載入變快算是附帶的好處，秘書長說「那也不錯」，但這不是主要目標。

### 非目標（本專案不做）

- 搬到 Cloudflare 或其他主機。主機**先留在 Vercel**，改成靜態部署；改寫完再另外討論要不要搬。
- 網站改版、新增內容或新增功能。
- 修改英文版的內容範圍。

### 反目標（做了就算失敗，即使技術上可行）

- **任何現有網址變成 404**，或轉址的目標和現在不同。現有的轉址：`/blog`→`/news`、`/notice`→`/news`、`/message`→`/about`、`/research`→`/document`、`/logo_represent`→`/logo-represent`，全部是永久轉址。
- **無障礙表現退步**：跳到主內容的連結、單一 h1、鍵盤可以操作的下拉選單、減少動態效果（`prefers-reduced-motion`）、外部連結的螢幕閱讀器提示、表格的橫向捲動區域、YouTube 嵌入的 title 等，任何一項消失或變差都算失敗。`npm run check:a11y` 現在檢查的項目，改寫後都必須照樣通過。
- **後台的資產自動推送失效**。正式後台會把上傳的檔案複製到 `armub:/home/gbanyan/docker/usher-site-autosync/public`，再 commit 並推到本 repo 的 `main`（`NEXTJS_AUTOPUSH_ASSETS=true`）。改寫後 `public/` 的目錄結構與檔名規則都不能變，例如 `uploads/`、`images/`、`attachment/`、`attachments/`。
- **後台發布後，網站永遠不更新**（重建沒被觸發，或觸發失敗卻沒有人知道）。
- 改寫期間正式站中斷，或 `main` 處在半成品狀態。

## 3. 限制

- 遵守專案 `CLAUDE.md`：內容來自 Laravel CMS（`~/Project/usher/usher-manage-stack`，本機 port 8001，正式 API `https://member.usher.org.tw/api/v1`）；單一資源的回應包在 `{ data }` 裡，`/homepage` 沒有包；要注意大小寫路徑；`categories?.length` 等欄位要用選擇性鏈結。
- **後台 API 有請求上限**：`RouteServiceProvider` 的 `api` limiter 是每分鐘 60 次，依使用者或 IP 計算。整站建置會在短時間內抓取所有內容，2026-10-22 已經撞到上限兩次。改成靜態重建之前，必須先解決這個問題（見 §4.4）。
- 後台程式的修改要走 `usher-manage-stack` 既有的流程：測試、phpstan、推到 Gitea `master`，再用 `scripts/deploy-armub-docker.sh` 部署。部署前先執行 `scripts/backup-armub-sqlite.sh`。
- 現有的檢查都必須繼續有效，並在新架構上重新接好：`npm run test`（Vitest）、`lint`、`check:content`、`check:assets`、`check:a11y`、`refresh:content`、`snapshot`。
- GitHub Actions 的 CI 用 snapshot 模式建置，不需要連線後台，也不需要任何密鑰，改寫後要維持這個做法。
- 中文介面文字一律使用台灣正體中文。

## 4. 已決定的內容

### 4.1 視覺與排版

外觀以現況為準。**秘書長接受因為採用 Astro 慣用寫法而帶來的小幅排版或視覺變化**，例如：

- 首頁輪播不再用 Swiper，改用原生捲動（scroll-snap）實作；
- 下拉選單改用原生元素，例如 `<details>` 或 popover。

條件是內容不變、無障礙表現不退步，而且整體配色、字體、版面結構看得出來是同一個網站。設計 token（`globals.css` 的主題色）、系統字型堆疊、Logo 子集字型都維持不變。

### 4.2 路由清單（必須逐一對應）

| 網址 | 內容 |
|---|---|
| `/` | 首頁：固定區塊＋`/homepage` API 的最新消息與相關報導 |
| `/about` | 創立目的（CMS page `about`）＋合法設立與治理文件表 |
| `/contact` | 聯繫資訊（CMS 組織資料＋本機 fallback） |
| `/news` | 活動與公告：全部 notice，加上不屬於 story／guides 的 blog，依日期由新到舊 |
| `/blog/[slug]`、`/notice/[slug]` | 文章詳細頁；麵包屑與「返回列表」連到 `/news` |
| `/story`、`/story/[slug]` | 病友故事（分類為 `story` 的 blog） |
| `/guides`、`/guides/[slug]` | 建議與指引（分類為 `guides` 的 blog） |
| `/related-news`、`/related-news/[slug]` | 相關報導 |
| `/document`、`/document/[slug]` | 協會文件（`/public-documents`） |
| `/structure`、`/logo-represent`、`/faq` | CMS 頁面 |
| `/en` | 英文入口 |
| `/sitemap.xml`、`/robots.txt` | 與現況相同 |
| 404 頁 | 與現況相同：常用頁面連結指向 `/news`、`/faq` |
| 轉址 | 見 §2 反目標：五條，全部是永久轉址 |

各頁目前的 metadata、canonical、Open Graph、JSON-LD（Organization、Article、WebPage）、`geo.*` 設定都要保留。

### 4.3 內容更新流程

```
後台發布／修改／刪除內容
  → Laravel 原本呼叫 /api/revalidate 的地方（SiteRevalidationService），改成呼叫 Vercel Deploy Hook
  → Vercel 從 main 重新建置（從正式 API 抓取全部內容）
  → 一到兩分鐘後上線
```

- 後台改成呼叫 Deploy Hook，**短時間內連續發布多次，只觸發一次重建**。可以沿用既有的 `RevalidateSiteContentJob`（已有「同一類型、同一 slug 在等待中時只排一次」的設計）；去重的範圍要改成「整站」，並加上延遲合併，例如最後一次變更後 60 秒才觸發。
- 觸發失敗時，必須在後台日誌或管理介面中看得到。
- **建置失敗的通知**（實作者的判斷）：Vercel 收到 Deploy Hook 後會先回傳成功，之後建置才開始；建置本身失敗時，後台不會知道。這部分依靠 Vercel 帳號擁有者（秘書長）的失敗通知 email；實作者要確認這項通知在 Vercel 專案中是開啟的。本專案不在後台新增建置狀態畫面。
- **單一內容有問題時**（實作者的判斷）：整次建置失敗，正式站維持上一個成功的版本，不會中斷，也不會發布不完整的網站。不採用「跳過問題內容、其餘照常上線」的做法。
- **哪些後台修改要觸發重建**（實作者的判斷）：原本會觸發 revalidate 的文章、頁面、公開文件變更都照舊觸發；另外加上組織資料（`/contact` 與頁尾）、文章分類與標籤的變更。
- **排程重建**（實作者的判斷）：每天 03:00（Asia/Taipei）重建一次，讓 `published_at` 設在未來、或 `expires_at` 已到期的內容，以及 02:00 排程封存的文件，能在隔天反映到網站上。
- **兩種模式並存**（實作者的判斷）：後台新增一個設定，例如 `SITE_UPDATE_MODE=revalidate|deploy_hook`，兩種模式都支援。切換時只要改這個設定；回滾時也只要改回 `revalidate`，不需要重新部署後台程式。舊的 revalidate 程式碼等新架構穩定至少兩週後才移除。
- 網站的 `/api/revalidate` 路由與 `REVALIDATE_TOKEN` 在切換後移除。後台的 `NEXTJS_REVALIDATE_URL`／`NEXTJS_REVALIDATE_TOKEN` 改為 Deploy Hook 的設定，舊值在切換完成後才移除。

### 4.4 解決建置時的 API 請求上限

在切換前完成，兩種做法擇一：

- **A（偏好）**：後台新增一個建置用的匯出端點，一次回傳網站需要的全部公開內容，包括文章、頁面、分類、公開文件、首頁資料與組織資料，讓建置只需要極少次請求。這個端點只回傳現有公開 API 已經公開的欄位。
- **B**：建置請求帶上專用的 token，`api` limiter 對這個 token 放寬上限。

選哪一種由實作者決定。但無論選哪一種，都不能讓未登入的一般請求取得更高的上限。

### 4.5 切換方式

- **在本 repo 的分支上改寫，不直接在 `main` 上做**。改寫期間，後台的資產自動推送仍會推到 `main`，切換前要先把 `main` 合併進分支。
- 用 Vercel 的預覽部署（Preview）來驗證分支。
- **預覽階段怎麼驗證重建流程**（實作者的判斷）：目前沒有測試用的後台。在預覽階段：
  1. 用 curl 直接呼叫分支專用的 Deploy Hook，確認 Vercel 會重建並抓到最新內容；
  2. 後台 `deploy_hook` 模式的觸發邏輯，以單元測試驗證（含去重、延遲合併與失敗記錄）。

  「從正式後台實際發布一次」的端對端測試，放到切換之後執行。做法是把一則現有頁面原樣重新儲存（內容不變），確認一到兩分鐘內觸發重建並上線。
- **切換前要做逐頁比對**：以現在正式站的 sitemap 和 §4.2 的路由清單為準，逐一比對新舊兩邊的 HTTP 狀態碼、轉址目標、`<title>`、h1、canonical，以及主要內容文字。全部一致，或差異符合 §4.1 的允許範圍，才能切換。
- 切換步驟：合併到 `main` → Vercel 正式部署 → 在後台改成呼叫 Deploy Hook → 發布一則測試修改，確認一到兩分鐘內上線 → 移除舊的 revalidate 設定。
- **回滾**（實作者的判斷）：分成兩層。
  - **立即止血（幾分鐘到幾小時）**：在 Vercel 用 Instant Rollback 切回上一個 Next.js 部署，後台 `SITE_UPDATE_MODE` 改回 `revalidate`，**同時把後台的 `NEXTJS_AUTOPUSH_ASSETS` 設為 `false`**；否則一有圖片上傳，後台就會推到 `main`，觸發新的正式部署，把 Astro 版本又放回正式站。限制是這段期間新上傳的圖片不會出現，因為被回滾的部署裡的 `public/` 是固定的。做完正式回滾之後，再把自動推送打開。
  - **正式回滾（問題無法在當天修好時）**：在 `main` 上用 `git revert` 撤銷合併，保留後台自動推送的資產 commit，讓 Vercel 從 `main` 重新部署 Next.js 版本。
  - 舊的 webhook 設定要等新架構穩定後才移除。

## 5. 留給實作者決定的部分

- Astro 的版本與整合套件。主機留在 Vercel，可以用純靜態輸出，不需要 Vercel adapter；需要時才加。
- 需要互動的元件要沿用 React island，或改寫成原生 HTML、CSS 加少量 JavaScript。偏好後者，前提是符合 §4.1 和無障礙要求。需要處理的元件有：輪播、搜尋視窗（目前用 `cmdk`＋Radix Dialog）、導覽列下拉選單與手機選單、捲到頂端、分頁、`LocaleDocument`。
- Markdown 渲染方式。必須保留現有行為：
  - 標題全部降一級；
  - 外部連結在新視窗開啟，並加上螢幕閱讀器提示；
  - 表格放在可橫向捲動、可以用鍵盤聚焦的區域；
  - 圖片延遲載入；
  - 只有一個 YouTube 網址、連結文字就是網址本身的段落，轉成 youtube-nocookie 播放器，保留開始時間，並給每個 iframe 不同的 title；
  - 不渲染原始 HTML。
- 圖片處理方式。目前用 `next/image` 搭配 remote patterns；改寫後可以在建置時優化，或直接輸出原圖加上寬高與延遲載入。不能出現版面跳動，也要注意 Linux 上檔名大小寫敏感的問題。
- 列表頁的分頁：目前在瀏覽器端分頁，網址不會變。可以維持，也可以改成靜態分頁頁面；如果改成靜態分頁，第一頁的網址仍然必須是原本的列表網址。
- `src/lib/` 裡和框架無關的模組盡量直接沿用：`api.ts`、`types.ts`、`transform.ts`、`article-sections.ts`、`nav.ts`、`utils.ts`、`contact.ts`、`governance.ts`、`metadata` 和 `jsonld` 的邏輯，以及它們的測試。
- 英文版 `/en` 的語系：要讓 `<html lang="en">` 直接出現在建置產生的 HTML 裡（目前是在瀏覽器端才改），這屬於順手改善。
- 改寫後 `CLAUDE.md`、`README.md`、`docs/DEVELOPMENT.md` 都要同步更新。

## 6. 驗證與完成條件

- 所有既有的單元測試都在新架構上通過；被沿用的模組不能為了配合改寫而刪掉測試。
- `check:a11y` 改成檢查 Astro 的輸出目錄，現有的檢查項目全部通過。
- §4.5 的逐頁比對全部通過。
- 用 Lighthouse 量測首頁、一篇文章頁、FAQ 頁在手機模式下的表現，記錄改寫前後的 JavaScript 傳輸量。結果只需要記錄，不設門檻；但如果數字明顯變差，要說明原因。
- 在預覽部署上，從後台發布一次測試修改，確認重建會被觸發、內容會更新。
- CI（snapshot 模式）建置成功。

## 7. 修訂（2026-10-23）：改為部署到 Cloudflare

秘書長決定這次改寫直接部署到 Cloudflare，不再停留在 Vercel。理由是 Cloudflare 可以用 Wrangler 從命令列完成部署、設定與回滾；停在 Vercel 的話，環境變數、Deploy Hook、存取保護等設定都必須由秘書長在網頁後台手動操作。本節**取代**前文中與 Vercel 有關的部分，包括 §2 非目標第一點、§4.3 的 Vercel Deploy Hook、§4.5 的 Vercel 預覽與回滾。

### 7.1 主機與網址

- 使用 **Cloudflare Workers 靜態資產**（Workers Static Assets），不使用 Pages。設定寫在 repo 的 `wrangler.jsonc`。純靜態輸出，不寫 Worker 程式碼。
- `assets.html_handling` 設為 `drop-trailing-slash`，`assets.not_found_handling` 設為 `404-page`。Astro 維持 `build.format: "file"`。
- 五條永久轉址寫在 `public/_redirects`，狀態碼 308；`vercel.json` 刪除。
- **已知且核准的差異**：`/news/` 這類結尾斜線網址、`/about.html` 這類 `.html` 網址，Cloudflare 會用 307 轉到乾淨網址；現況則分別是 308 轉址和 404。比對工具要把這兩類列為「已核准的狀態差異」，只允許符合這兩種模式、而且轉址目標正確的網址，其他狀態差異一律不准核准。
- 網域 `www.usher.org.tw` 的 DNS 已經在 Cloudflare。切換時把網域綁成 Worker 的 Custom Domain，Vercel 專案保留不動，作為回滾目標。

### 7.2 建置與內容更新

- Workers Builds 只能由 Git 推送觸發，沒有 Deploy Hook，所以建置和部署改由 **GitHub Actions** 負責。workflow 的觸發來源有三種：
  - 推送到 `main`，包括後台的資產自動推送；
  - `repository_dispatch`（事件類型 `cms-content-changed`），由後台發布內容時觸發；
  - 手動觸發（`workflow_dispatch`）。
- workflow 依序執行：安裝 → 測試 → 用 api 模式建置（帶 `SITE_BUILD_TOKEN`）→ `check:a11y` → `wrangler deploy`。任何一步失敗都不部署，正式站維持上一個版本；GitHub 會寄失敗通知給 repo 擁有者。
- 同一時間只跑一次建置，新的觸發排在後面等候，不取消正在跑的建置，也不平行部署（使用 `concurrency`，且 `cancel-in-progress: false`）。
- 每日 03:00 的重建維持由後台排程觸發，改成發 `repository_dispatch`。
- **後台的修改**：`TriggerSiteRebuildJob` 改成呼叫 GitHub API `POST /repos/gbanyan/usher-site/dispatches`，帶 `Authorization: Bearer <token>` 與 JSON body `{"event_type":"cms-content-changed"}`，成功時回傳 204。
  - 新增設定 `SITE_REBUILD_GITHUB_TOKEN`（fine-grained token，只對 usher-site 有 Contents: write，這是 `repository_dispatch` 的必要權限）和 `SITE_REBUILD_GITHUB_REPO`。
  - `SITE_DEPLOY_HOOK_URL` 不再使用，可以移除。
  - token 和 Deploy Hook 網址一樣不得寫進日誌。去重、延遲合併、重試、失敗記錄等既有機制全部保留。
  - 模式名稱維持 `deploy_hook`，代表「整站重建」，不再改名。
- GitHub repo secrets：`CLOUDFLARE_API_TOKEN`（只有 Workers 部署權限）、`CLOUDFLARE_ACCOUNT_ID`、`SITE_BUILD_TOKEN`。

### 7.3 預覽、比對與切換

- **預覽**：用 `wrangler versions upload` 上傳不啟用的新版本，取得公開的預覽網址，不需要繞過存取保護。逐頁比對與 Lighthouse 都對這個網址執行。
- **切換步驟**：
  1. 合併到 `main`，GitHub Actions 部署 Worker；
  2. 用 workers.dev 網址做一次完整比對；
  3. 把 `www.usher.org.tw` 綁到 Worker；
  4. 在正式網域再比對一次；
  5. 後台改成 `deploy_hook` 模式，並設好 GitHub token；
  6. 端對端測試：後台存一次頁面，約兩分鐘內上線。
- **回滾**：
  - **立即止血**：把網域綁回 Vercel，後台改回 `revalidate`，並暫停資產自動推送。注意：`main` 已經是 Astro 版，Vercel 收到推送會建置失敗，但正式部署維持舊版，不受影響。
  - **Worker 本身的問題**：用 `wrangler rollback` 切回上一個 Worker 版本。
- Vercel 專案在新架構穩定兩週後，才討論是否移除。

### 7.4 授權（一次性，秘書長操作）

- **Cloudflare**：在終端機執行 `npx wrangler login`，授權本機。實作者再用它建立一組只能部署 Workers 的 API token，存進 GitHub secret。
- **GitHub**：建立後台要用的 fine-grained token（只限 usher-site、Contents: write）。可以由秘書長在 GitHub 網頁建立；如果 `gh` 的登入權限足夠，也可以由實作者代為處理。
