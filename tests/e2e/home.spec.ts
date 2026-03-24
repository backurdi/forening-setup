import { expect, test } from "@playwright/test";

test("home page renders scaffold messaging", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /type-safe platform/i })).toBeVisible();
  await expect(page.getByText(/Next.js as the only public backend surface/i)).toBeVisible();
});
