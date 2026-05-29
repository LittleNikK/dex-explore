import { test, expect } from "@playwright/test";

test("swap page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Swap")).toBeVisible();
});
