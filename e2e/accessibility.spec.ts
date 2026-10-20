import { test, expect } from "@playwright/test";
for (const width of [390, 1280])
  test(
    "supports keyboard selection and fits viewport " + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("./");
      const search = page.getByRole("searchbox");
      await search.focus();
      await page.keyboard.press("Tab");
      await page
        .getByRole("button", {
          name: "Selecionar Caminho das águas",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", {
          name: "Remover Caminho das águas",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page
          .locator("body")
          .evaluate((el) => el.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "Gerar PDF" }),
      ).toBeDisabled();
    },
  );
