import { expect, test, type Page } from "@playwright/test";

async function seedDemoSession(page: Page, uid = "test-eco-user-id") {
  await page.addInitScript((demoUid) => {
    window.localStorage.setItem(
      "_demo_auth_user",
      JSON.stringify({
        uid: demoUid,
        email: demoUid === "test-eco-user-id" ? "test@ecoscore.com" : "new-user@example.com",
        displayName: demoUid === "test-eco-user-id" ? "Test Eco User" : "New User",
      })
    );
  }, uid);
}

test.describe("EcoScore critical user journeys", () => {
  test("signup validates required fields before account creation", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("form").evaluate((form: HTMLFormElement) => {
      form.noValidate = true;
    });

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Name is required" })).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("onboarding lets an incomplete local session progress through setup choices", async ({
    page,
  }) => {
    await seedDemoSession(page, "new-user-incomplete");
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /get started/i }).click();
    await page.getByLabel("Country").fill("India");
    await page.getByLabel("City / Region").fill("Bengaluru");
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByRole("radio", { name: "Vegetarian" }).click();
    await page.getByRole("radio", { name: "Metro" }).click();
    await page.getByRole("radio", { name: "Apartment" }).click();
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByRole("button", { name: "Reduce Transport Footprint" }).click();
    await page.getByRole("button", { name: /calculate ecoscore/i }).click();

    await expect(page.getByText(/generating initial footprint baseline/i)).toBeVisible();
  });

  test("protected simulator routes send incomplete demo sessions to onboarding", async ({ page }) => {
    await seedDemoSession(page);

    await page.goto("/simulator");

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByRole("heading", { name: /welcome to ecoscore/i })).toBeVisible();
  });
});
