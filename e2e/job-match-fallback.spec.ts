import { expect, test } from "@playwright/test";

/**
 * Main-path e2e without relying on a live LLM.
 * Job bank + local fallback / rules should still produce a match HUD.
 */
test.describe("job match workspace (offline-capable)", () => {
  test("sample resume → match → shows decision HUD", async ({ page }) => {
    await page.goto("/apps/job-match?mode=job-bank");

    await expect(
      page.getByRole("heading", { name: /先放入简历|简历/i }).first(),
    ).toBeVisible({ timeout: 30_000 });

    // Fill sample resume via UI control
    const sampleBtn = page.getByRole("button", { name: /填入示例/ });
    await sampleBtn.click();

    // Privacy opt-out control should exist
    await expect(page.getByTestId("opt-out-history")).toBeVisible();

    const matchBtn = page.getByRole("button", { name: /开始岗位匹配/ }).first();
    await expect(matchBtn).toBeEnabled();
    await matchBtn.click();

    // Wait for analysis pipeline to finish (AI or fallback)
    await expect(
      page.getByText(/匹配决策总览|岗位匹配排序|简历解读/, { exact: false }).first(),
    ).toBeVisible({ timeout: 90_000 });

    // Synthetic sample badge or score should appear
    const synthetic = page.getByText(/合成样本/, { exact: false }).first();
    await expect(synthetic).toBeVisible({ timeout: 15_000 });

    // Skill evidence map is primary visualization
    await expect(page.getByTestId("skill-evidence-map")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("market-fit mode shows real JD emphasis", async ({ page }) => {
    await page.goto("/apps/job-match?mode=market-fit");
    await expect(page.getByText(/真实 JD/, { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
