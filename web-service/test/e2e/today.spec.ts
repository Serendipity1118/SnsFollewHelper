import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const castsCsv = fileURLToPath(new URL("../fixtures/casts.csv", import.meta.url));

type Page = import("@playwright/test").Page;

/** 更新系APIは同一オリジンの Origin が必要（CSRF対策）なので明示して呼ぶ。 */
async function callApi(page: Page, method: "POST" | "PUT", path: string, data?: unknown) {
  const origin = new URL(page.url() || String(test.info().project.use.baseURL)).origin;
  const res = await page.request.fetch(path, { method, data, headers: { origin } });
  expect(res.ok()).toBe(true);
}

async function importAndAssign(page: Page) {
  await page.goto("/import");
  const castsForm = page.locator('form[data-api="/api/import/casts"]');
  await castsForm.locator('input[type="file"]').setInputFiles(castsCsv);
  await castsForm.getByRole("button", { name: "取り込む" }).click();
  await expect(castsForm.locator("[data-result]")).toContainText("完了");
  // 上限・当日状態を前のテストから持ち越さない
  await callApi(page, "PUT", "/api/settings", { hourlyLimit: 15, dailyLimit: 15 });
  await callApi(page, "POST", "/api/today/release");
  await page.goto("/");
  await page.locator("#next").click();
  await expect(page.locator(".row").first()).toBeVisible();
}

test("未処理の5件を開く: ポップアップが許可されていれば5タブ開く（x.com へは出ない）", async ({ page, context }) => {
  await context.route("https://x.com/**", (route) => route.fulfill({ status: 200, body: "stub" }));
  await importAndAssign(page);
  const opened: string[] = [];
  context.on("page", (p) => opened.push(p.url()));
  await page.locator("#open5").click();
  await expect.poll(() => opened.length).toBe(5);
  await expect(page.locator("#message")).toHaveText("");
});

test("未処理の5件を開く: ポップアップがブロックされたら許可手順を表示する", async ({ page }) => {
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

test("取込 → 当日生成 → 済 → リロード後も保持 → 上限で開けなくなる", async ({ page }) => {
  await page.goto("/import");
  const castsForm = page.locator('form[data-api="/api/import/casts"]');
  await castsForm.locator('input[type="file"]').setInputFiles(castsCsv);
  await castsForm.getByRole("button", { name: "取り込む" }).click();
  await expect(castsForm.locator("[data-result]")).toContainText("personal: 11");

  await page.goto("/settings");
  await page.getByLabel("直近1時間のフォロー上限").fill("2");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.locator("[data-result]")).toContainText("hourlyLimit: 2");

  // 同じDBを使う前のテストの「当日」を戻してから始める
  await callApi(page, "POST", "/api/today/release");
  await page.goto("/");
  await expect(page.locator("#list")).toContainText("今日の名簿はまだありません");
  await page.locator("#next").click();
  await expect(page.locator("#progress")).toHaveText("残り 11 / 11");

  const first = page.locator(".row").first();
  await expect(first).toContainText("@frank");
  await expect(first.getByRole("link", { name: "Xを開く" })).toHaveAttribute("href", "/go/frank");
  await first.getByRole("button", { name: "済" }).click();
  await expect(page.locator("#progress")).toHaveText("残り 10 / 11");

  // キーボード: 1 で先頭（gina）を済にする → 上限2に到達
  await page.keyboard.press("1");
  await expect(page.locator("#progress")).toHaveText("残り 9 / 11");
  await expect(page.locator("#quota")).toContainText("フォロー上限に達しました");
  await expect(page.locator("#open5")).toBeDisabled();
  await expect(page.locator(".row").first().getByText("上限到達")).toBeVisible();

  // 取り消し（U）で gina が戻る。上限の数え方は変わらない
  await page.keyboard.press("u");
  await expect(page.locator("#progress")).toHaveText("残り 10 / 11");
  await expect(page.locator(".row").first()).toContainText("@gina");

  await page.reload();
  await expect(page.locator("#progress")).toHaveText("残り 10 / 11");
  await expect(page.locator("#quota")).toContainText("フォロー上限に達しました");

  const blocked = await page.request.get("/go/gina", { maxRedirects: 0 });
  expect(blocked.status()).toBe(429);

  // 上限到達時だけ「制限をリセットする」が出て、確認後にリセットされる
  const reset = page.getByRole("button", { name: "制限をリセットする" });
  await expect(reset).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await reset.click();
  await expect(page.locator("#quota")).not.toContainText("フォロー上限に達しました");
  await expect(page.locator("#quota")).toContainText("あと 2 件開ける");
  await expect(reset).toBeHidden();
  await expect(page.locator("#open5")).toBeEnabled();
  await expect(page.locator(".row").first().getByRole("link", { name: "Xを開く" })).toBeVisible();
});
