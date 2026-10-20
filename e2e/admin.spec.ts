import { test, expect } from "@playwright/test";
import path from "node:path";
test("reviews a DOCX upload, publishes it and hides administrative forms after logout", async ({
  page,
}) => {
  await page.goto("./#/admin");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("admin@acervo.local.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Local-Musical-Test-2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Administrar acervo" }),
  ).toBeVisible();
  await page
    .getByLabel("Enviar arquivos")
    .setInputFiles(path.resolve("tests/fixtures/letra com espaços.docx"));
  const title = "Importação E2E " + Date.now();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await expect(
    page.getByRole("textbox", { name: "Conteúdo", exact: true }),
  ).toHaveValue(/Voz e coração/);
  await page
    .getByRole("checkbox", {
      name: "Conferi o texto, as quebras de linha e o alinhamento.",
    })
    .check();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByText("Publicado no acervo", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Acervo", exact: true }).click();
  await page.getByRole("searchbox").fill(title);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
});
