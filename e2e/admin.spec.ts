import { test, expect } from "@playwright/test";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

test("removes one of four PDF songs and reviews the other three together on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole("combobox").selectOption("chords");
  const prefix = "Escolha E2E " + Date.now();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  for (let n = 1; n <= 4; n++)
    pdf.addPage().drawText(`${prefix} ${n}\nC   G\nVerso para cantar`, {
      font,
      x: 40,
      y: 740,
      size: 12,
      lineHeight: 18,
    });
  await page.getByLabel("Enviar arquivos").setInputFiles({
    name: "Escolha.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  });
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(4);
  await expect(page.getByRole("textbox", { name: /Artista/ })).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: `Remover ${prefix} 2 da revisão`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(3);
  await page
    .getByRole("group", { name: "Ações do lote", exact: true })
    .getByRole("button", { name: "Marcar todos como revisados", exact: true })
    .click();
  const checks = page.getByRole("checkbox", { name: /Conferi o texto/ });
  for (let n = 0; n < 3; n++) await expect(checks.nth(n)).toBeChecked();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Publicar revisados", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(0);
  for (const n of [1, 3, 4])
    await expect(
      page.getByRole("heading", { name: `${prefix} ${n}`, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: `${prefix} 2`, exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Acervo", exact: true }).click();
  await page.getByRole("button", { name: "Cifras", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Buscar título ou trecho", exact: true })
    .fill("VERSO PARA CANTAR");
  await expect(
    page.getByRole("button", {
      name: new RegExp(`^Visualizar cifra de ${prefix} `),
    }),
  ).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: `${prefix} 2`, exact: true }),
  ).toHaveCount(0);
});

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
  await expect(
    page.getByRole("textbox", { name: "Conteúdo", exact: true }),
  ).toHaveCount(0);
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

test("separates PDF chord pages, joins a continuation and lets visitors consult the result", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/admin");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("admin@acervo.local.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Local-Musical-Test-2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("combobox").selectOption("chords");
  await page
    .getByLabel("Enviar arquivos")
    .setInputFiles(path.resolve("tests/fixtures/cifras multiplas.pdf"));
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(3);
  await expect(
    page.getByText("A próxima página pode ser continuação desta cifra."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Juntar com a próxima página", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Separar páginas", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Juntar com a próxima página", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("textbox", { name: "Conteúdo", exact: true }).first(),
  ).toHaveValue(/Mais um verso para cantar/);
  await page
    .getByRole("checkbox", {
      name: "Conferi o texto, as quebras de linha e o alinhamento.",
    })
    .first()
    .check();
  await page
    .getByRole("button", { name: "Publicar", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveValue("Outra manhã");
  await page
    .getByRole("checkbox", {
      name: "Conferi o texto, as quebras de linha e o alinhamento.",
    })
    .check();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Acervo", exact: true }).click();
  await page.getByRole("button", { name: "Cifras", exact: true }).click();
  await page.getByRole("searchbox").fill("Canção do encontro");
  await page
    .getByRole("button", {
      name: "Visualizar cifra de Canção do encontro",
      exact: true,
    })
    .click();
  await expect(page.locator("pre.song-content")).toContainText(
    "Vamos cantar juntos",
  );
  await expect(page.locator("pre.song-content")).toContainText(
    "Mais um verso para cantar",
  );
  await expect(page.getByRole("button", { name: "Gerar PDF" })).toBeDisabled();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("types a lyric on mobile, previews it and publishes without a document", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/admin");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("admin@acervo.local.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Local-Musical-Test-2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Digitar", exact: true }).click();
  const title = "Letra manual E2E " + Date.now();
  const content = "Voz e coração\n\nUma nova manhã";
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await page.getByRole("textbox", { name: "Letra", exact: true }).fill(content);
  await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Página 1 do PDF" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar prévia da música", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Conferi o texto, as quebras de linha e o alinhamento.",
    })
    .check();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByText("Publicado no acervo", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("textbox", { name: "Letra", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Publicar", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Acervo", exact: true }).click();
  await page.getByRole("searchbox").fill(title);
  await page
    .getByRole("button", { name: "Visualizar letra de " + title, exact: true })
    .click();
  await expect(page.locator("pre.song-content")).toHaveText(content);
});
