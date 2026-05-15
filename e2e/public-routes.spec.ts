import { expect, test } from "@playwright/test";

const routes = [
  {
    path: "/",
    visibleText: "Rankings",
    title: /Toon Ranks/i,
  },
  {
    path: "/about",
    visibleText: "About Toon Ranks",
    title: /About \| Toon Ranks/i,
  },
  {
    path: "/contact",
    visibleText: "Contact Us",
    title: /Contact \| Toon Ranks/i,
  },
  {
    path: "/terms",
    visibleText: "Terms of Service",
    title: /Terms of Service \| Toon Ranks/i,
  },
  {
    path: "/privacy",
    visibleText: "Privacy Policy",
    title: /Privacy Policy \| Toon Ranks/i,
  },
  {
    path: "/how-rankings-work",
    visibleText: "How Rankings Work",
    title: /How Rankings Work \| Toon Ranks/i,
  },
];

test.describe("public route smoke tests", () => {
  for (const route of routes) {
    test(`${route.path} renders public content`, async ({ page }) => {
      const response = await page.goto(route.path);

      expect(response?.ok()).toBe(true);
      await expect(page).toHaveTitle(route.title);
      await expect(page.getByText(route.visibleText).first()).toBeVisible();
      await expect(page.getByText("Toon Ranks").first()).toBeVisible();
    });
  }
});
