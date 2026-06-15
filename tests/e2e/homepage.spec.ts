import { test, expect } from "@playwright/test";

test.describe("EcoScore Homepage E2E Tests", () => {
  test("successfully loads and renders the main layout", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Verify standard page elements are displayed
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Verify main body contains general information or main CTA
    await expect(page).toHaveTitle(/EcoScore/i);
  });
});
