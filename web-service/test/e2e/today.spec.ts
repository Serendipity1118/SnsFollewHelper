import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const castsCsv = fileURLToPath(new URL("../fixtures/casts.csv", import.meta.url));
const STATUS_COLUMN = 8;

/** expected_queue.csv の状態をすべて「未」・実施日を空にした個人名簿（テストごとにまっさらへ戻す用）。 */
const cleanQueueCsv = (() => {
  const text = readFileSync(fileURLToPath(new URL("../fixtures/expected_queue.csv", import.meta.url)), "utf8");
  const [header, ...rows] = text.trimEnd().split(/\r?\n/);
  const reset = rows.map((row) => {
    const cells = row.split(",");
    return [...cells.slice(0, STATUS_COLUMN), "未", ""].join(",");
  });
  return Buffer.from([header, ...reset].join("\r\n") + "\r\n", "utf8");
})();

type Page = import("@playwright/test").Page;

/** 更新系APIは同一オリジンの Origin が必要（CSRF対策）なので明示して呼ぶ。 */
async function callApi(page: Page, method: "POST" | "PUT", path: string, data?: unknown) {
  const origin = new URL(page.url() || String(test.info().project.use.baseURL)).origin;
  const res = await page.request.fetch(path, { method, data, headers: { origin } });
  expect(res.ok()).toBe(true);
}

async function importCasts(page: Page) {
  await page.goto("/admin");
  const castsForm = page.locator('form[data-api="/api/import/casts"]');
  await castsForm.locator('input[type="file"]').setInputFiles(castsCsv);
  await castsForm.getByRole("button", { name: "取り込む" }).click();
  await expect(castsForm.locator("[data-result]")).toContainText("個人 11 人");
}

/** 同じDBを使う前のテストの結果・上限の集計を持ち越さない。 */
async function resetState(page: Page) {
  const origin = new URL(page.url()).origin;
  const res = await page.request.post("/api/import/queue", {
    headers: { origin },
    multipart: { file: { name: "queue.csv", mimeType: "text/csv", buffer: cleanQueueCsv }, kind: "personal" },
  });
  expect(res.ok()).toBe(true);
  await callApi(page, "POST", "/api/quota/reset");
}

/** 取り込んで、まっさらな状態から今日の名簿を出す。 */
async function importAndAssign(page: Page) {
  await importCasts(page);
  await resetState(page);
  await callApi(page, "PUT", "/api/settings", { hourlyLimit: 15, dailyLimit: 15 });
  await page.goto("/");
  await page.getByRole("button", { name: /件を出す/ }).click();
  await expect(pendingRows(page).first()).toBeVisible();
}

const pendingRows = (page: Page) => page.locator(".row:not(.done)");

// 上限の集計は handle ごとに初めて「済」にした時刻だけを数える。ほかのテストが同じ人を済にする前に走らせる。
test("取込 → 名簿を出す → フォローした → リロード後も保持 → 上限で開けなくなる", async ({ page }) => {
  await importCasts(page);

  await page.goto("/admin");
  await page.getByLabel("1時間あたりの上限").fill("2");
  await page.getByLabel("24時間あたりの上限").fill("15");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.locator("#settings [data-result]")).toHaveText("保存しました。");

  await resetState(page);
  await page.goto("/");
  await expect(page.locator("#list")).toContainText("今日の名簿はまだありません");
  await page.getByRole("button", { name: "今日の 15 件を出す" }).click();
  await expect(page.locator("#progress")).toHaveText("残り 11 件 / 11 件");

  const first = pendingRows(page).first();
  await expect(first).toContainText("@frank");
  await expect(first).toContainText("東京");
  await expect(first.getByRole("link", { name: "Xで開く" })).toHaveAttribute("href", "/go/frank");
  await first.getByRole("button", { name: "フォローした" }).click();
  await expect(page.locator("#progress")).toHaveText("残り 10 件 / 11 件");
  await expect(page.locator("#toast")).toContainText("をフォロー済みにしました");

  // キーボード: 1 で次の人（gina）をフォローした → 上限2に到達
  await page.keyboard.press("1");
  await expect(page.locator("#progress")).toHaveText("残り 9 件 / 11 件");
  await expect(page.locator("#quotaAlert")).toContainText("フォロー上限に達しました");
  await expect(page.locator("#open5")).toBeDisabled();
  await expect(pendingRows(page).first().getByText("上限到達")).toBeVisible();

  // 取り消し（U）で gina が戻る。上限の数え方は変わらない
  await page.keyboard.press("u");
  await expect(page.locator("#progress")).toHaveText("残り 10 件 / 11 件");
  await expect(page.locator(".row.active")).toContainText("@gina");

  await page.reload();
  await expect(page.locator("#progress")).toHaveText("残り 10 件 / 11 件");
  await expect(page.locator("#quotaAlert")).toContainText("フォロー上限に達しました");

  const blocked = await page.request.get("/go/gina", { maxRedirects: 0 });
  expect(blocked.status()).toBe(429);

  // 上限到達時だけ「制限をリセットする」が出て、確認後にリセットされる
  const reset = page.getByRole("button", { name: "制限をリセットする" });
  await expect(reset).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await reset.click();
  await expect(page.locator("#quotaAlert")).toBeHidden();
  await expect(page.locator("#stats")).toContainText("あと 2 件フォローできます");
  await expect(page.locator("#open5")).toBeEnabled();
  await expect(pendingRows(page).first().getByRole("link", { name: "Xで開く" })).toBeVisible();
});

test("まとめて開く: ポップアップが許可されていれば5タブ開く（x.com へは出ない）", async ({ page, context }) => {
  await context.route("https://x.com/**", (route) => route.fulfill({ status: 200, body: "stub" }));
  await importAndAssign(page);
  const opened: string[] = [];
  context.on("page", (p) => opened.push(p.url()));
  await expect(page.locator("#open5")).toHaveText("まとめて開く（5件）");
  await page.locator("#open5").click();
  await expect.poll(() => opened.length).toBe(5);
  await expect(page.locator("#message")).toBeHidden();
  // 開いた5件に印が付き、まとめてフォローしたにできる
  await expect(page.locator(".badge-opened")).toHaveCount(5);
  await page.getByRole("button", { name: "開いた 5 件をフォローしたにする" }).click();
  await expect(page.locator("#progress")).toHaveText("残り 6 件 / 11 件");
});

test("まとめて開く: ポップアップがブロックされたら許可手順を表示する", async ({ page }) => {
  // Chrome の既定動作（1クリック1タブ）を再現する
  await page.addInitScript(() => {
    const original = window.open.bind(window);
    let allowed = 1;
    window.open = (...args: Parameters<typeof window.open>) => (allowed-- > 0 ? original(...args) : null);
  });
  await page.context().route("https://x.com/**", (route) => route.fulfill({ status: 200, body: "stub" }));
  await importAndAssign(page);
  await page.locator("#open5").click();
  await expect(page.locator("#message")).toContainText("ポップアップブロックで 4 件が開けませんでした");
});

test("Xで開くと「開いた」印が付き、結果を付けた行は戻せる", async ({ page, context }) => {
  await context.route("https://x.com/**", (route) => route.fulfill({ status: 200, body: "stub" }));
  await importAndAssign(page);
  const first = pendingRows(page).first();
  await expect(first).toContainText("@frank");
  const popup = page.waitForEvent("popup");
  await first.getByRole("link", { name: "Xで開く" }).click();
  await popup;
  await expect(pendingRows(page).first().locator(".badge-opened")).toHaveText("開いた");

  await pendingRows(page).first().getByRole("button", { name: "見送る" }).click();
  await expect(page.locator("#toast")).toContainText("を見送りました");
  // 処理済みは下の折りたたみにまとまる
  await expect(pendingRows(page).first()).toContainText("@gina");
  await page.getByText("処理済み 1 件（見送り 1）").click();
  const done = page.locator(".row.done").first();
  await expect(done).toContainText("@frank");
  await done.getByRole("button", { name: "戻す" }).click();
  await expect(page.locator(".row.done")).toHaveCount(0);
  await expect(page.locator("#progress")).toHaveText("残り 11 件 / 11 件");
});

test("名簿: タブ・検索・状態で絞り込める", async ({ page }) => {
  await importCasts(page);
  await page.goto("/list");
  await expect(page.getByRole("link", { name: /個人/ })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("キーワード").fill("ShopF");
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody")).toContainText("@frank");
  await page.getByRole("link", { name: "条件をクリア" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(11);
  await page.getByRole("link", { name: /店舗垢候補/ }).first().click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
