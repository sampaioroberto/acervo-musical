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
      const layout = await page.locator("body").evaluate((el) => ({
        viewport: window.innerWidth,
        body: el.scrollWidth,
        overflow: [...el.querySelectorAll("*")]
          .filter(
            (node) => node.getBoundingClientRect().right > window.innerWidth,
          )
          .map((node) => ({
            tag: node.tagName,
            className: node.className,
            right: node.getBoundingClientRect().right,
            width: node.getBoundingClientRect().width,
          })),
      }));
      expect(layout.body, JSON.stringify(layout)).toBeLessThanOrEqual(
        layout.viewport,
      );
      await expect(
        page.getByRole("button", { name: "Gerar PDF" }),
      ).toBeDisabled();
    },
  );
