# Astro 改寫 — 後台（CMS）準備工作 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the Laravel CMS so the static Astro site can be rebuilt on publish (Vercel Deploy Hook, debounced, plus a daily rebuild) and fetch all content at build time without hitting the API rate limit — while production behaviour stays unchanged until cutover flips one setting.

**Architecture:** A new `SITE_UPDATE_MODE` setting (`revalidate` default | `deploy_hook`) switches `SiteRevalidationService` between today's per-item Next.js webhook and a single, debounced, queued `TriggerSiteRebuildJob`. Organization-profile, category and tag edits gain a `siteDataChanged()` hook. A `SITE_BUILD_TOKEN` header lifts the `api` rate limit for the site build only.

**Tech Stack:** Laravel 13, PHPUnit, database queue, Larastan.

**Choice on spec §4.4:** This plan takes **B (build token)**, not the spec's preferred A (a bulk export endpoint). B adds no new response shape and no new data surface: the build calls exactly the public endpoints and fields it uses today, so `src/lib/api.ts` and `snapshot-content.mjs` stay unchanged apart from one header. A would add a second API shape that must be kept in sync with the per-resource endpoints. Cost if this choice is wrong: builds still make about 60 requests, now without being throttled; A can be added later without touching the site.

**Spec:** `docs/superpowers/specs/2026-10-22-astro-migration-design.md`（§3、§4.3、§4.4、§4.5）

**Repo:** `~/Project/usher/usher-manage-stack`（branch `master`, Gitea）。Run every command below from that repo.

## Global Constraints

- 預設 `SITE_UPDATE_MODE=revalidate`：本計畫部署後，正式站行為**完全不變**；切換由 Astro 計畫的 cutover 任務執行。
- 兩種模式並存，舊的 revalidate 程式碼不刪除（spec：穩定至少兩週後才移除）。
- 觸發失敗必須記在後台日誌（`Log::error`），而且永遠不能讓後台操作失敗。
- 建置 token 只放寬帶有正確 token 的請求；未登入的一般請求上限維持每分鐘 60 次。比對 token 要用 `hash_equals`。
- 測試期間不得真的呼叫外部 Deploy Hook，照 `revalidate_in_tests` 的既有模式，新增 `rebuild_in_tests` 開關。
- 每次正式部署前先執行 `scripts/backup-armub-sqlite.sh <label>`。部署使用 `scripts/deploy-armub-docker.sh`，部署前先跑 `--dry-run`。
- 驗證指令：`php artisan test`（全部）、`./vendor/bin/phpstan analyse --memory-limit=1G`。

## Review Focus

- 一次批次操作（例如合併分類、匯入文章）在幾秒內觸發幾十次變更 → 只應排入**一個**重建工作。（Task 1 測試 `test_bursts_collapse_into_one_rebuild`）
- Deploy Hook URL 沒設定、但 mode 已經是 `deploy_hook`（設定打錯）→ 不排工作、記一則 warning，後台操作照常成功。（Task 1 測試 `test_deploy_hook_mode_without_url_logs_and_skips`）
- Vercel 回 5xx 或連線逾時 → 重試，最後失敗時寫 `Log::error`，不能拋例外。（Task 1 測試 `test_failed_trigger_retries_then_logs_error`）
- 有人猜錯或不帶 token → 照樣只有每分鐘 60 次。（Task 4 測試 `test_wrong_build_token_keeps_default_limit`）
- 在 `revalidate` 模式下執行每日排程 → 什麼都不做，也不報錯。（Task 3 測試 `test_rebuild_command_is_a_noop_in_revalidate_mode`）

---

### Task 1: 更新模式設定、`TriggerSiteRebuildJob`，以及 `SiteRevalidationService` 的模式切換

**Files:**
- Modify: `config/services.php`（新增 `site` 區塊）
- Create: `app/Jobs/TriggerSiteRebuildJob.php`
- Modify: `app/Services/SiteRevalidationService.php`
- Modify: `.env.example`（新增四個變數並附註解）
- Test: `tests/Feature/Cms/SiteRebuildTriggerTest.php`

**Interfaces:**
- Produces:
  - `config('services.site.update_mode')`: `'revalidate'|'deploy_hook'`（env `SITE_UPDATE_MODE`，預設 `revalidate`）
  - `config('services.site.deploy_hook_url')`（env `SITE_DEPLOY_HOOK_URL`）
  - `config('services.site.rebuild_delay')`: int 秒（env `SITE_REBUILD_DELAY_SECONDS`，預設 `30`；30 秒延遲加上約 90 秒的 Vercel 建置，總共約兩分鐘，符合秘書長同意的「一到兩分鐘」）
  - `config('services.site.build_token')`（env `SITE_BUILD_TOKEN`）
  - `config('services.site.rebuild_in_tests')`: 預設 `false`
  - `App\Jobs\TriggerSiteRebuildJob`：`ShouldQueue` + `ShouldBeUniqueUntilProcessing`，`uniqueId(): 'site-rebuild'`，`uniqueFor = 600`，`tries = 3`，`afterCommit()`；`handle()` 先呼叫 `PublicApiCache::flush()`（避免建置讀到交易提交前就被重新填入的快取，也涵蓋 03:00 排程重建），再對 hook URL 發 `POST`（timeout 10 秒）
  - `SiteRevalidationService::requestSiteRebuild(): void`（public）
  - `SiteRevalidationService::siteDataChanged(): void`（public；清快取，並在 `deploy_hook` 模式下要求重建）

- [ ] **Step 1: Write the failing tests** in `SiteRebuildTriggerTest`. `setUp` sets `services.site.rebuild_in_tests=true`, `update_mode=deploy_hook`, `deploy_hook_url=https://api.vercel.test/hook`, `rebuild_delay=30`. Each test gets a fresh array cache, so the `site-rebuild` unique lock never leaks between tests.

```php
public function test_deploy_hook_mode_queues_one_delayed_rebuild_instead_of_revalidate(): void
{
    Queue::fake();
    SiteRevalidationService::revalidateArticle('hello');
    Queue::assertPushed(TriggerSiteRebuildJob::class, fn ($job) => $job->delay !== null && $job->afterCommit === true);
    Queue::assertNotPushed(RevalidateSiteContentJob::class);
}

public function test_bursts_collapse_into_one_rebuild(): void
{
    Queue::fake();
    foreach (range(1, 20) as $i) { SiteRevalidationService::revalidateArticle("a{$i}"); }
    SiteRevalidationService::revalidatePage('faq');
    SiteRevalidationService::revalidateDocument('uuid');
    Queue::assertPushed(TriggerSiteRebuildJob::class, 1);
}

public function test_revalidate_mode_keeps_existing_behaviour(): void
{
    config(['services.site.update_mode' => 'revalidate', 'services.nextjs.revalidate_in_tests' => true,
            'services.nextjs.revalidate_url' => 'https://site.test/api/revalidate', 'services.nextjs.revalidate_token' => 't']);
    Queue::fake();
    SiteRevalidationService::revalidateArticle('hello');
    Queue::assertPushed(RevalidateSiteContentJob::class, 1);
    Queue::assertNotPushed(TriggerSiteRebuildJob::class);
}

public function test_deploy_hook_mode_without_url_logs_and_skips(): void
{
    config(['services.site.deploy_hook_url' => null]);
    Queue::fake(); Log::spy();
    SiteRevalidationService::revalidateArticle('hello');
    Queue::assertNothingPushed();
    Log::shouldHaveReceived('warning')->once();
}

public function test_job_posts_to_the_deploy_hook(): void
{
    Http::fake(['api.vercel.test/*' => Http::response(['job' => ['id' => 'x']], 201)]);
    (new TriggerSiteRebuildJob)->handle();
    Http::assertSent(fn ($r) => $r->method() === 'POST' && $r->url() === 'https://api.vercel.test/hook');
}

public function test_failed_trigger_without_retries_left_logs_error(): void
{
    Http::fake(['api.vercel.test/*' => Http::response('down', 503)]);
    Log::spy();
    (new TriggerSiteRebuildJob)->handle();   // no queue job attached → no retry path
    Log::shouldHaveReceived('error')->once();
}

public function test_failed_trigger_is_released_for_retry_while_attempts_remain(): void
{
    Http::fake(['api.vercel.test/*' => Http::response('down', 503)]);
    $queueJob = Mockery::mock(\Illuminate\Contracts\Queue\Job::class);
    $queueJob->shouldReceive('getConnectionName')->andReturn('database');
    $queueJob->shouldReceive('attempts')->andReturn(1);
    $queueJob->shouldReceive('release')->once()->with(30);
    $job = new TriggerSiteRebuildJob; $job->setJob($queueJob);
    $job->handle();
}

public function test_job_flushes_public_api_cache_before_posting(): void
{
    Http::fake(); Cache::put(/* a PublicApiCache key, see PublicApiCacheTest */ 'public-api:homepage', 'stale');
    (new TriggerSiteRebuildJob)->handle();
    $this->assertFalse(Cache::has('public-api:homepage'));   // use the real key/helper from PublicApiCache
}

public function test_site_data_changed_requests_rebuild_in_deploy_hook_mode(): void
{
    Queue::fake();
    SiteRevalidationService::siteDataChanged();
    Queue::assertPushed(TriggerSiteRebuildJob::class, 1);
}

public function test_site_data_changed_only_flushes_cache_in_revalidate_mode(): void
{
    config(['services.site.update_mode' => 'revalidate']);
    Queue::fake();
    SiteRevalidationService::siteDataChanged();
    Queue::assertNothingPushed();
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `php artisan test --filter=SiteRebuildTriggerTest`
Expected: FAIL — `Class "App\Jobs\TriggerSiteRebuildJob" not found`.

- [ ] **Step 3: Implement.**
  - **config 和 `.env.example`**：照 Interfaces 新增設定與變數。
  - **`TriggerSiteRebuildJob`**：照 `RevalidateSiteContentJob` 的寫法，一樣使用 `shouldRetry()` 和 `release(30 * attempts)`。成功時 `Log::info('Site rebuild triggered')`；最後失敗時 `Log::error("Site rebuild trigger failed: {$reason}")`；永遠不拋例外。
  - **`SiteRevalidationService::revalidate()`**：先 `PublicApiCache::flush()`。`update_mode === 'deploy_hook'` 時呼叫 `requestSiteRebuild()` 後 return；否則照舊。
  - **`requestSiteRebuild()`**：測試環境要有 `rebuild_in_tests` 才動作。URL 是空的就 `Log::warning(...)` 後 return。否則執行 `TriggerSiteRebuildJob::dispatch()->delay(now()->addSeconds(config('services.site.rebuild_delay')))`，並用 try/catch 包住 dispatch，寫法同現有的 `revalidate()`。
  - **`siteDataChanged()`**：先 `PublicApiCache::flush()`，然後只在 `deploy_hook` 模式下呼叫 `requestSiteRebuild()`。

- [ ] **Step 4: Run to verify they pass**

Run: `php artisan test --filter='SiteRebuildTriggerTest|SiteRevalidationQueueTest'`
Expected: PASS（新測試和既有的 revalidate 佇列測試都通過）

- [ ] **Step 5: Commit**

```bash
git add config/services.php app/Jobs/TriggerSiteRebuildJob.php app/Services/SiteRevalidationService.php .env.example tests/Feature/Cms/SiteRebuildTriggerTest.php
git commit -m "feat(site): add deploy-hook rebuild mode alongside revalidate"
```

---

### Task 2: 組織資料、分類、標籤的變更也觸發重建

**Files:**
- Modify: `app/Http/Controllers/Admin/OrganizationProfileController.php`（`update`）
- Modify: `app/Http/Controllers/Admin/ArticleCategoryController.php:52,81,98`、`app/Http/Controllers/Admin/ArticleTagController.php:48,73,87`（把 `PublicApiCache::flush()` 換成 `SiteRevalidationService::siteDataChanged()`）
- Test: `tests/Feature/Cms/SiteRebuildTriggerTest.php`（新增）

**Interfaces:**
- Consumes: Task 1 `SiteRevalidationService::siteDataChanged()`, `TriggerSiteRebuildJob`.

- [ ] **Step 1: Write the failing tests**：以 admin 身分打既有路由，參考 `tests/Feature/Cms/OrganizationProfileTest.php`、`CmsTaxonomyAuditLogTest.php` 的寫法，包括 CSRF middleware 的處理方式。組織資料的路由是 `PATCH` `admin.organization.profile.update`（`routes/web.php:154`）。**每個動作各寫一個測試**：`ShouldBeUniqueUntilProcessing` 的鎖在 `Queue::fake()` 下不會釋放，所以同一個測試裡連續 create、update、delete，只會看到第一次 push。

```php
public function test_organization_profile_update_requests_rebuild(): void   // PATCH/PUT admin.organization-profile.update with valid payload
public function test_category_create_requests_rebuild(): void
public function test_category_update_requests_rebuild(): void
public function test_category_delete_requests_rebuild(): void
public function test_tag_create_requests_rebuild(): void
public function test_tag_update_requests_rebuild(): void
public function test_tag_delete_requests_rebuild(): void   // each: Queue::fake(); act; Queue::assertPushed(TriggerSiteRebuildJob::class, 1)
```

- [ ] **Step 2: Run to verify they fail**

Run: `php artisan test --filter=SiteRebuildTriggerTest`
Expected: 三個新測試 FAIL，原因是 `TriggerSiteRebuildJob` 沒有被 push。

- [ ] **Step 3: Implement**：分類、標籤的六處 `PublicApiCache::flush()` 改成 `SiteRevalidationService::siteDataChanged()`（它內部會 flush，快取行為不變）；組織資料的 `update` 存檔成功後也呼叫它。如果 `OrganizationProfileController::update` 原本有清快取，一併改成這個呼叫。

- [ ] **Step 4: Run to verify they pass**

Run: `php artisan test --filter='SiteRebuildTriggerTest|PublicApiCacheTest|OrganizationProfileTest|CmsTaxonomyAuditLogTest'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Admin tests/Feature/Cms/SiteRebuildTriggerTest.php
git commit -m "feat(site): rebuild after organization profile, category and tag changes"
```

---

### Task 3: 每日重建排程 `site:rebuild`

**Files:**
- Create: `app/Console/Commands/RebuildSite.php`（signature `site:rebuild`）
- Modify: `app/Console/Kernel.php`（`schedule()`）
- Test: `tests/Feature/Cms/SiteRebuildCommandTest.php`

**Interfaces:**
- Consumes: `SiteRevalidationService::requestSiteRebuild()`.
- Produces: `php artisan site:rebuild`。在 `deploy_hook` 模式下排入重建並輸出 `Site rebuild queued.`；否則輸出 `Skipped: SITE_UPDATE_MODE is revalidate.`；兩種情況都回傳 exit code 0。

- [ ] **Step 1: Write the failing tests**

```php
public function test_rebuild_command_queues_rebuild_in_deploy_hook_mode(): void
{ /* config deploy_hook + url + rebuild_in_tests; Queue::fake(); */
  $this->artisan('site:rebuild')->expectsOutput('Site rebuild queued.')->assertExitCode(0);
  Queue::assertPushed(TriggerSiteRebuildJob::class, 1); }

public function test_rebuild_command_is_a_noop_in_revalidate_mode(): void
{ /* update_mode revalidate */ $this->artisan('site:rebuild')->expectsOutput('Skipped: SITE_UPDATE_MODE is revalidate.')->assertExitCode(0);
  Queue::assertNothingPushed(); }

public function test_rebuild_is_scheduled_daily_at_three(): void
{ $events = collect(app(Schedule::class)->events())->filter(fn ($e) => str_contains($e->command, 'site:rebuild'));
  $this->assertCount(1, $events); $this->assertSame('0 3 * * *', $events->first()->expression); }
```

- [ ] **Step 2: Run to verify they fail**

Run: `php artisan test --filter=SiteRebuildCommandTest`
Expected: FAIL，錯誤為 `Command "site:rebuild" is not defined`。

- [ ] **Step 3: Implement**：新增 command；在 Kernel 加上 `$schedule->command('site:rebuild')->dailyAt('03:00')->withoutOverlapping();`（`config/app.php` 的時區是 `Asia/Taipei`）。

- [ ] **Step 4: Run to verify they pass**

Run: `php artisan test --filter=SiteRebuildCommandTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Console/Commands/RebuildSite.php app/Console/Kernel.php tests/Feature/Cms/SiteRebuildCommandTest.php
git commit -m "feat(site): schedule a daily site rebuild at 03:00"
```

---

### Task 4: 建置用 token 放寬 API 請求上限

**Files:**
- Modify: `app/Providers/RouteServiceProvider.php:28-30`（`api` limiter）
- Test: `tests/Feature/Cms/SiteBuildRateLimitTest.php`

**Interfaces:**
- Produces：請求帶有 `X-Site-Build-Token: <SITE_BUILD_TOKEN>` 標頭時，`api` limiter 回傳 `Limit::none()`。Astro 計畫的 `fetchAPI` 和 `snapshot-content.mjs` 會帶這個標頭。

- [ ] **Step 1: Write the failing tests**：設定 `services.site.build_token = 'build-secret'`，對 `GET /api/v1/categories` 連續請求 61 次。

```php
public function test_build_token_lifts_the_api_rate_limit(): void
{ foreach (range(1, 61) as $i) { $this->getJson('/api/v1/categories', ['X-Site-Build-Token' => 'build-secret'])->assertOk(); } }

public function test_wrong_build_token_keeps_default_limit(): void
{ foreach (range(1, 60) as $i) { $this->getJson('/api/v1/categories', ['X-Site-Build-Token' => 'nope'])->assertOk(); }
  $this->getJson('/api/v1/categories', ['X-Site-Build-Token' => 'nope'])->assertStatus(429); }

public function test_no_token_configured_keeps_default_limit(): void
{ config(['services.site.build_token' => null]);
  foreach (range(1, 60) as $i) { $this->getJson('/api/v1/categories', ['X-Site-Build-Token' => ''])->assertOk(); }
  $this->getJson('/api/v1/categories', ['X-Site-Build-Token' => ''])->assertStatus(429); }
```

- [ ] **Step 2: Run to verify they fail**

Run: `php artisan test --filter=SiteBuildRateLimitTest`
Expected: `test_build_token_lifts_the_api_rate_limit` FAIL，第 61 次請求回傳 429。

- [ ] **Step 3: Implement**：在 `api` limiter 的 closure 開頭加上判斷：設定的 token 不是空的，而且 `hash_equals($token, (string) $request->header('X-Site-Build-Token'))` 成立時，回傳 `Limit::none()`；其他情況維持原本的 `Limit::perMinute(60)`。

- [ ] **Step 4: Run to verify they pass**

Run: `php artisan test --filter=SiteBuildRateLimitTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Providers/RouteServiceProvider.php tests/Feature/Cms/SiteBuildRateLimitTest.php
git commit -m "feat(api): let the site build bypass the API rate limit with a token"
```

---

### Task 5: 全套驗證、部署、設定 build token

**Files:**
- Modify: `docs/DEPLOYMENT.md`（「正式 `.env` 必要設定」表格新增 `SITE_UPDATE_MODE`、`SITE_DEPLOY_HOOK_URL`、`SITE_REBUILD_DELAY_SECONDS`、`SITE_BUILD_TOKEN`，並說明切換與回滾方式）
- armub `/home/gbanyan/docker/usher-manage-stack/.env`（只新增 `SITE_BUILD_TOKEN`；`SITE_UPDATE_MODE` 不設，維持預設的 `revalidate`）

- [ ] **Step 1: 全套驗證**

Run: `php artisan test` → 全部 PASS；`./vendor/bin/phpstan analyse --memory-limit=1G` → `[OK] No errors`

- [ ] **Step 2: Commit 文件並推送**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: document site update mode and build token settings"
git push origin master
```

- [ ] **Step 3: 部署**

依序執行：`scripts/backup-armub-sqlite.sh pre-site-rebuild-mode` → `scripts/deploy-armub-docker.sh --dry-run` → `scripts/deploy-armub-docker.sh`
Expected：腳本輸出 `Application response: HTTP 200`，`.deploy-revision` 等於本次的 HEAD。

- [ ] **Step 4: 設定 build token**

用 `openssl rand -hex 32` 產生 token，寫入 armub `.env` 的 `SITE_BUILD_TOKEN`，然後執行 `docker compose up -d --force-recreate app`。token 值不寫進任何 commit 或文件，之後交給 Astro 計畫設定成 Vercel 的環境變數。

- [ ] **Step 5: 正式環境核對（行為不變）**
  - 在 armub 執行 `docker compose exec app php artisan site:rebuild` → 輸出 `Skipped: SITE_UPDATE_MODE is revalidate.`
  - 對正式 API 連續請求 70 次 `/api/v1/categories`：帶正確 token 的全部回傳 200；不帶 token 的在第 61 次左右回傳 429。
  - 在後台存一次任意頁面，`/api/revalidate` 照樣被呼叫，正式站照常更新。
