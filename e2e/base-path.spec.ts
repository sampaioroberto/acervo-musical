import { test, expect } from "@playwright/test";
test("opens administration directly below the GitHub Pages base path", async ({
  page,
}) => {
  await page.goto("/louvores-cora/#/admin");
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
});
test("loads fonts and PDF worker under the project path", async ({ page }) => {
  const errors: string[] = [];
  page.on("response", (r) => {
    if (r.status() === 404) errors.push(r.url());
  });
  await page.goto("./");
  for (const title of [
    "Caminho das águas",
    "Canção do amanhecer",
    "Casa de vento",
    "Horizonte sereno",
  ])
    await page
      .getByRole("button", { name: "Selecionar " + title, exact: true })
      .click();
  await page.getByRole("button", { name: "Gerar PDF" }).click();
  await expect(
    page.getByRole("img", { name: "Página 1 do PDF" }),
  ).toBeVisible();
  await expect(page.getByText("Página 1 de 1")).toBeVisible();
  expect(errors).toEqual([]);
});
