# Astro 改寫 — 改部署到 Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the finished Astro site (branch `astro-migration`) to Cloudflare Workers Static Assets with GitHub Actions builds, switch the CMS rebuild trigger to GitHub `repository_dispatch`, then cut over `www.usher.org.tw`.

**Architecture:** `wrangler.jsonc` describes an assets-only Worker serving `dist/`, with `public/_redirects` for the five 308 redirects. A GitHub Actions workflow builds (api mode, build token) and runs `wrangler deploy` on push to `main`, on `repository_dispatch: cms-content-changed`, and on manual dispatch. The CMS `TriggerSiteRebuildJob` posts that dispatch. Vercel stays untouched as the rollback target.

**Tech Stack:** Wrangler (latest stable, pinned in devDependencies), GitHub Actions, Laravel 13.

**Spec:** `docs/superpowers/specs/2026-10-22-astro-migration-design.md` §7 (supersedes the Vercel parts). **Supersedes:** site plan Task 10 Steps 5–7 and Task 11.

## Global Constraints

- 主機用 **Workers Static Assets**（不用 Pages），純靜態，不寫 Worker 程式碼；`assets.html_handling: "drop-trailing-slash"`、`assets.not_found_handling: "404-page"`。
- 五條永久轉址放在 `public/_redirects`，狀態碼 308：`/blog`→`/news`、`/notice`→`/news`、`/message`→`/about`、`/research`→`/document`、`/logo_represent`→`/logo-represent`。
- 已核准的狀態差異只有兩類：結尾斜線網址 307 轉到無斜線網址（現況是 308）；`.html` 網址 307 轉到乾淨網址（現況是 404）。轉址目標都必須正確。除此之外，任何狀態差異都不准核准。
- 密鑰（Cloudflare API token、GitHub token、`SITE_BUILD_TOKEN`）不寫進 commit、文件或日誌；GitHub secrets 用 `gh secret set`，從檔案或 stdin 讀值，不出現在指令列。
- 建置全有或全無，失敗就不部署；GitHub Actions 的 `concurrency` 設為不平行、`cancel-in-progress: false`。
- 改寫期間 `main` 不動，直到 Task 6 才合併；Vercel 專案設定不修改。
- 後台 `SITE_UPDATE_MODE` 在 Task 6 之前維持 `revalidate`，正式站行為不變。

## Review Focus

- 後台在短時間內連續觸發多次 → GitHub 只排一次重建；建置期間又來新的觸發 → 本次建置跑完後，再接著建置一次（不取消、不遺漏）。（Task 2 workflow `concurrency` 設定，加上 Task 3 job 去重測試）
- GitHub API 回傳 401/403/422，例如 token 過期或權限不足 → 後台記錄 `Log::error`，訊息裡不含 token，後台操作照常成功。（Task 3 測試）
- `www.usher.org.tw` 綁到 Worker 後，`usher.org.tw`（沒有 www）的轉址行為和現況相同。（Task 6 比對清單要包含沒有 www 的網域）
- 後台推送資產到 `main` → GitHub Actions 會建置並部署，新上傳的圖片幾分鐘內就能用。（Task 6 端對端測試）
- 不存在的網址 → 回傳 404 狀態碼，並顯示站內的 404 頁面，不是 Cloudflare 的預設錯誤頁。（Task 1 本機 `wrangler dev` 檢查，加上 Task 5 比對）

---

### Task 1: Cloudflare 設定檔與轉址（網站）

**Files:**
- Create: `wrangler.jsonc`, `public/_redirects`, `src/lib/cloudflare-config.test.ts`
- Delete: `vercel.json`, `src/lib/vercel-config.test.ts`
- Modify: `package.json`（devDependency `wrangler`，用精確版本；script `deploy: wrangler deploy`、`preview:cf: wrangler dev`）, `src/lib/parity.ts` + `scripts/check-parity.mjs`（新增已核准的狀態差異規則）, `CLAUDE.md`/`README.md`/`docs/DEVELOPMENT.md`（把 Vercel 改成 Cloudflare）

**Interfaces:**
- `wrangler.jsonc`：`{ "name": "usher-site", "compatibility_date": "<install day>", "assets": { "directory": "./dist", "html_handling": "drop-trailing-slash", "not_found_handling": "404-page" } }`，沒有 `main`。
- `parity.ts`：`isApprovedStatusDifference(path: string, old: {status, location}, neu: {status, location}): boolean`。結尾斜線的情況：old 為 301/308、new 為 307，且兩邊轉址目標一致時回傳 true。`.html` 的情況：old 為 404，new 為 307 轉到去掉 `.html` 的路徑時回傳 true。其他情況一律回傳 false。

- [ ] **Step 1: Write the failing tests**：`cloudflare-config.test.ts` 用 `jsonc-parser` 讀取 wrangler.jsonc，或先移除註解再 `JSON.parse`；確認 `html_handling`、`not_found_handling` 的值，以及 `_redirects` 的五行規則都是 308。`parity.test.ts` 新增 `isApprovedStatusDifference` 的測試：兩種核准情況回傳 true；轉址目標不同、old 為 200、new 為 404 都回傳 false。
- [ ] **Step 2: 執行測試，確認失敗**：`npx vitest run src/lib/cloudflare-config.test.ts src/lib/parity.test.ts`，FAIL。
- [ ] **Step 3: Implement**，並更新文件。
- [ ] **Step 4: Verify**：
  - `npm run test && npm run lint && CONTENT_SOURCE=snapshot npm run build`；
  - 用 `npx wrangler dev --port 8788` 在本機起服務（不需要登入），檢查以下網址：
    - `/about` 回傳 200；
    - `/about/`、`/about.html` 都回傳 307 轉到 `/about`；
    - `/blog` 回傳 308 轉到 `/news`；
    - `/nope` 回傳 404，內容是站內 404 頁（包含 `href="/faq"`）；
    - `/About` 回傳 404。
- [ ] **Step 5: Commit**：`feat: serve the static site from Cloudflare Workers assets`。

---

### Task 2: GitHub Actions 建置與部署（網站）

**Files:**
- Create: `.github/workflows/deploy.yml`
- Keep: `.github/workflows/ci.yml`（PR 和非 main 分支，用 snapshot 模式）

**Interfaces:**
- 觸發：`push` 到 `main`、`repository_dispatch: types: [cms-content-changed]`、`workflow_dispatch`。
- `concurrency: { group: deploy-production, cancel-in-progress: false }`。
- 步驟：checkout（LFS 打開）→ setup-node 24 → `npm ci` → `npm run test` → `npm run build`（env：`CONTENT_SOURCE=api`、`CMS_API_URL`、`SITE_URL=https://www.usher.org.tw`、`SITE_BUILD_TOKEN` 取自 secrets）→ `npm run check:a11y` → `npx wrangler deploy`（env：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`）。
- 在 `wrangler.jsonc` 設 `"workers_dev": true`；最後一個 step 的 summary 印出部署的版本 ID。

- [ ] **Step 1: 本機驗證 YAML**：`npx --yes @action-validator/cli .github/workflows/deploy.yml`，或用 `actionlint`（如果已安裝）。Expected：無錯誤。
- [ ] **Step 2: Commit**：`ci: build and deploy to Cloudflare from GitHub Actions`。這個 workflow 在合併到 `main` 之前不會觸發部署。

---

### Task 3: 後台改用 GitHub `repository_dispatch` 觸發重建（CMS）

**Repo:** `~/Project/usher/usher-manage-stack`，分支 `site-rebuild-github`。

**Files:**
- Modify: `config/services.php`（`site.github_repo` 對應 env `SITE_REBUILD_GITHUB_REPO`，預設 `gbanyan/usher-site`；`site.github_token` 對應 env `SITE_REBUILD_GITHUB_TOKEN`；移除 `deploy_hook_url`）、`app/Jobs/TriggerSiteRebuildJob.php`、`app/Services/SiteRevalidationService.php`（`requestSiteRebuild()` 的判斷條件改成檢查 token）、`app/Console/Commands/RebuildSite.php`（未排入時的訊息改成 `Site rebuild not queued: SITE_REBUILD_GITHUB_TOKEN is not set or dispatch failed.`）、`.env.example`、`docs/DEPLOYMENT.md`
- Test: `tests/Feature/Cms/SiteRebuildTriggerTest.php`、`SiteRebuildCommandTest.php`（同步更新）

**Interfaces:**
- `handle()`：`PublicApiCache::flush()` → `Http::withToken($token)->acceptJson()->withHeaders(['X-GitHub-Api-Version' => '2022-11-28'])->timeout(10)->post("https://api.github.com/repos/{$repo}/dispatches", ['event_type' => 'cms-content-changed'])`。回應 204 視為成功；其他回應依既有的重試流程處理，最後失敗時 `Log::error`。訊息裡的 token 一律換成 `[github-token]`。

- [ ] **Step 1: Write the failing tests**：
  - POST 到 `https://api.github.com/repos/gbanyan/usher-site/dispatches`，帶 Bearer token 和 `event_type`；
  - GitHub 回 401 時，記一筆 error，訊息裡沒有 token；
  - 沒設定 token 時發 warning、不排入工作；
  - 原有的去重、延遲、重試、`site:rebuild` 測試都改成新的設定名稱。
- [ ] **Step 2: 執行測試，確認失敗**：`php artisan test --filter='SiteRebuild'`，FAIL。
- [ ] **Step 3: Implement。**
- [ ] **Step 4: Verify**：`php artisan test`（全部）、`./vendor/bin/phpstan analyse --memory-limit=1G`。
- [ ] **Step 5: Commit。** 合併到 `master` 與部署放在 Task 6，因為部署前要先準備好 token；這一步只 commit，不推送。

---

### Task 4: 授權與密鑰設定（需要秘書長）

**這一步要停下來請秘書長操作，逐項提供要做的事和要填的值。**

- [ ] **Step 1: Cloudflare 登入**：秘書長在終端機執行 `! npx wrangler login`。完成後執行 `npx wrangler whoami`，確認帳號和 account ID。
- [ ] **Step 2: Cloudflare API token（給 GitHub Actions 用）**：請秘書長到 Cloudflare dashboard → My Profile → API Tokens，用「Edit Cloudflare Workers」範本建立 token，範圍限定這個帳號。token 存到 `~/.config/usher/cloudflare-deploy-token`（權限 600），**不要貼在對話裡**。然後執行 `gh secret set CLOUDFLARE_API_TOKEN < ~/.config/usher/cloudflare-deploy-token`，以及 `gh secret set CLOUDFLARE_ACCOUNT_ID --body <id>`。
- [ ] **Step 3: SITE_BUILD_TOKEN**：`ssh armub 'grep ^SITE_BUILD_TOKEN= …/.env | cut -d= -f2' | gh secret set SITE_BUILD_TOKEN`，用管線直接傳，不經過畫面。
- [ ] **Step 4: GitHub fine-grained token（給後台用）**：請秘書長到 GitHub → Settings → Developer settings → Fine-grained tokens 建立 token：只限 `gbanyan/usher-site`，權限只開 Contents: Read and write，期限一年，並把到期日記進 `docs/DEPLOYMENT.md`。token 存到 `~/.config/usher/github-dispatch-token`（權限 600）。
- [ ] **Step 5: DNS 權限（給實作者在本機做切換與回滾用，不放進 GitHub）**：請秘書長建立一組 Cloudflare API token：
  - Permissions：`Zone → DNS → Edit`、`Zone → Zone → Read`、`Zone → Workers Routes → Edit`；
  - Zone Resources：只限 `usher.org.tw`；
  - 存到 `~/.config/usher/cloudflare-dns-token`（權限 600）。

  這組 token 只在本機使用，透過 `CLOUDFLARE_API_TOKEN` 環境變數交給 `curl` 呼叫 Cloudflare API，不放進 repo 或 GitHub secrets。用途有三個：
  - 切換前讀取並備份 `usher.org.tw` 的全部 DNS 記錄，存到 `~/.config/usher/dns-backup-<日期>.json`；
  - 切換時刪除 `www` 指向 Vercel 的舊記錄，讓 Worker 的 Custom Domain 接手；
  - 回滾時依照備份重建舊記錄。

  核對：用這組 token 呼叫 `GET /zones?name=usher.org.tw` 和 `GET /zones/<id>/dns_records`，兩個都要成功；備份檔裡要有 `www` 和根網域的記錄。
- [ ] **Step 6: 核對**：`gh secret list` 列出三個 secret；`npx wrangler whoami` 正常；DNS 備份已建立。

---

### Task 5: 預覽部署、逐頁比對與 Lighthouse（網站）

- [ ] **Step 1: 第一次部署**：`CMS_API_URL=… SITE_BUILD_TOKEN=… npm run build && npx wrangler deploy`。Worker 第一次建立時，只會有 `usher-site.<subdomain>.workers.dev` 網址，網域還沒綁上去，正式站不受影響。記錄 workers.dev 網址。
- [ ] **Step 2: 逐頁比對**：`npm run check:parity https://www.usher.org.tw https://usher-site.<subdomain>.workers.dev`。Expected：除了 `parity-allow.json` 裡的項目和兩類核准的狀態差異之外，沒有其他差異。剩下的每條差異都要修到消失，或寫明屬於 spec 允許的哪一項。依照 Task 9 的說明，把各頁「只差日期」的項目逐頁加進 allowlist。
- [ ] **Step 3: Lighthouse**：在手機模式下量測首頁、`/story/document-694e4dd6`、`/faq` 的新舊版本（`npx lighthouse <url> --preset=perf --form-factor=mobile --output=json`，用系統的 Chrome）。把 JavaScript 傳輸量、效能分數、LCP、CLS 記在 spec 最後新增的「量測結果」一節。
- [ ] **Step 4: 停下來**：把比對結果和 Lighthouse 數據交給秘書長確認。

---

### Task 6: 切換上線（需要秘書長確認後才開始）

- [ ] **Step 1: 合併**：`git checkout main && git merge --no-ff astro-migration && git push origin main`。GitHub Actions 的 deploy workflow 會觸發，部署 Worker；Vercel 也會建置，但會失敗，正式網域仍然指向 Vercel 上的舊版，不受影響。確認 Actions 執行成功。
- [ ] **Step 2: 綁定網域**：
  1. 先重新讀一次 DNS 記錄，和 Task 4 的備份比對，確認沒有其他變動；
  2. 用 DNS token 刪除 `www` 指向 Vercel 的那一筆記錄；
  3. **馬上**在 `wrangler.jsonc` 加上 `"routes": [{ "pattern": "www.usher.org.tw", "custom_domain": true }]`，在本機用 `npx wrangler deploy` 部署，不等 Actions，盡量縮短網域沒有記錄的時間（通常不到一分鐘）；
  4. 再 commit 並 push，讓 repo 的設定和實際狀態一致。

  `usher.org.tw`（沒有 www）的記錄這一步不動；只有在比對發現它的轉址行為和現況不同時，才另外處理，並先請秘書長確認。

  回滾方式：刪除 Worker 的 Custom Domain，再用備份重建 `www` 的舊記錄。
- [ ] **Step 3: 正式網域比對**：`npm run check:parity <Vercel 上最後一次 Next.js 正式部署的網址> https://www.usher.org.tw`，結果要和 Task 5 相同。沒有 www 的 `https://usher.org.tw` 轉址行為也要和現況一致。
- [ ] **Step 4: 後台切換**：
  1. 執行 `scripts/backup-armub-sqlite.sh pre-cloudflare-cutover`；
  2. 把 Task 3 的分支合併到 `master`、推送、部署；
  3. 在 armub `.env` 寫入 `SITE_REBUILD_GITHUB_TOKEN`（從 `~/.config/usher/github-dispatch-token` 用 ssh 管線寫入），並設 `SITE_UPDATE_MODE=deploy_hook`；
  4. `docker compose up -d --force-recreate app`；
  5. 執行 `php artisan site:rebuild`，輸出應為 `Site rebuild queued.`，而且 Actions 出現一次 `repository_dispatch` 建置。
- [ ] **Step 5: 端對端測試**：在後台把 `faq` 頁原樣存一次，約 30 秒後 Actions 開始建置，兩分鐘內完成部署。後台上傳一張測試圖片，確認資產推送觸發部署，圖片可以開啟；測完把圖片刪除。
- [ ] **Step 6: 回報**：把結果回報給秘書長，並列出回滾方式（spec §7.3）和兩週後的清理事項：移除 revalidate 程式碼、`NEXTJS_REVALIDATE_*`、Vercel 專案。
