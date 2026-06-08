import { test, expect } from "@playwright/test";

test.describe("MSTSwap E2E Smoke & Edge Cases Suite", () => {
  
  test("Page navigation smoke test", async ({ page }) => {
    // 1. Go to main page (Swap page)
    await page.goto("/");
    await expect(page.getByText("MSWAP").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Wallet" }).first()).toBeVisible();

    // 2. Navigate to Explore
    await page.click("text=Explore", { force: true });
    await expect(page.url()).toContain("/explore");
    await expect(page.getByText("Market Analytics")).toBeVisible();

    // 3. Navigate to Portfolio
    await page.click("text=Portfolio", { force: true });
    await expect(page.url()).toContain("/portfolio");
    
    // 4. Navigate back to Swap
    await page.click("text=Swap", { force: true });
    await expect(page.url()).toContain("/");
  });

  test("Currency toggle (USD <-> INR) updates layout dynamically", async ({ page }) => {
    // 1. Navigate directly to liquidity page
    await page.goto("/liquidity");
    await expect(page.getByText("Liquidity Pools")).toBeVisible();

    // 2. Select INR and verify currency display updates
    const inrButton = page.getByRole("button", { name: "INR (₹)" });
    await inrButton.click();
    await expect(inrButton).toHaveClass(/text-cyan-400/);

    // 3. Select USD and verify currency display updates
    const usdButton = page.getByRole("button", { name: "USD ($)" });
    await usdButton.click();
    await expect(usdButton).toHaveClass(/text-cyan-400/);
  });

  test("Slippage settings boundaries & custom warning logic", async ({ page }) => {
    await page.goto("/");
    
    // 1. Open the settings modal
    const settingsButton = page.locator("button:has(svg.lucide-settings)");
    await settingsButton.click();
    
    // Check settings popover is visible
    await expect(page.getByText("MSWAP Settings")).toBeVisible();
    await expect(page.getByText("Slippage tolerance")).toBeVisible();

    // 2. Locate custom slippage input textbox
    const slippageInput = page.locator(".relative.w-20.flex.items-center input");
    await expect(slippageInput).toBeVisible();

    // 3. Test low slippage warning: 0.05% (< 0.5% boundary)
    await slippageInput.fill("0.05");
    await expect(page.getByText("Slippage is low. Your transaction may revert.")).toBeVisible();

    // 4. Test high slippage warning: 8.5% (> 5.0% boundary)
    await slippageInput.fill("8.5");
    await expect(page.getByText("Slippage is high. Your transaction may be frontrun.")).toBeVisible();

    // 5. Test auto reset
    await page.click("button:has-text('Auto')");
    await expect(page.getByText("Slippage is low. Your transaction may revert.")).not.toBeVisible();
    await expect(page.getByText("Slippage is high. Your transaction may be frontrun.")).not.toBeVisible();
  });
});
