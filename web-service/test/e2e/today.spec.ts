import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const castsCsv = fileURLToPath(new URL("../fixtures/casts.csv", import.meta.url));

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
});
