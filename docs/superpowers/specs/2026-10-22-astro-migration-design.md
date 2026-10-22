# 網站改寫為 Astro — 設計文件

日期：2026-10-22
狀態：待秘書長核可

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
  - **立即止血（幾分鐘到幾小時）**：在 Vercel 用 Instant Rollback 切回上一個 Next.js 部署，後台 `SITE_UPDATE_MODE` 改回 `revalidate`。限制是這段期間新上傳的圖片不會出現，因為被回滾的部署裡的 `public/` 是固定的。
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
