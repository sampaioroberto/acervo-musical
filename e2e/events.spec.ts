import { test, expect } from "@playwright/test";
import path from "node:path";
test("organizes a visit, imports a song into the archive, preserves snapshots and exposes both PDFs to visitors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/admin/events");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("admin@acervo.local.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Local-Musical-Test-2026!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("button", { name: "Organizar visita", exact: true })
    .click();
  const title = "Cora",
    songTitle = "Nova do evento " + Date.now();
  await expect(
    page.getByRole("textbox", { name: "Nome do evento", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Data", { exact: true }).fill("2026-05-16");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Músicas", exact: true }).click();
  await expect(page).toHaveURL(/#\/admin\/events$/);
  await expect(page.getByLabel("Data", { exact: true })).toHaveValue(
    "2026-05-16",
  );
  await page
    .getByRole("button", {
      name: "Adicionar letra de Canção do amanhecer",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Retirar cifra Canção do amanhecer",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retirar letra Canção do amanhecer",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Tipo de música", exact: true })
    .selectOption("chords");
  await page
    .getByRole("button", {
      name: "Adicionar cifra de Canção do amanhecer",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Letras (1)", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cifras (1)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar músicas novas", exact: true })
    .click();
  await page
    .getByLabel("Enviar arquivos para o evento", { exact: true })
    .setInputFiles(path.resolve("tests/fixtures/letra com espaços.docx"));
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill(songTitle);
  await page
    .getByRole("checkbox", {
      name: "Conferi o texto, as quebras de linha e o alinhamento.",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", {
      name: "Publicar no acervo e adicionar",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveCount(0);
  const savedEventResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/rest/v1/rpc/save_event") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Publicar evento", exact: true })
    .click();
  const savedEvent = (await (await savedEventResponse).json()) as {
    id: string;
  };
  await expect(
    page.getByText("Evento publicado.", { exact: true }),
  ).toBeVisible();
  await page.locator(`a[href="#/events/${savedEvent.id}"]`).click();
  const eventUrl = page.url();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Visualizar letra de " + songTitle,
      exact: true,
    })
    .click();
  await expect(page.getByText(/Voz e coração/)).toBeVisible();
  await page
    .getByRole("button", { name: "PDF das letras", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Página 1 do PDF", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toContain(
    "2026-05-16-letras.pdf",
  );
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "PDF das cifras", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Página 1 do PDF", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  // A later edit in the archive must not rewrite this visit's snapshot.
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await page
    .getByRole("button", { name: "Editar " + songTitle, exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Conteúdo", exact: true })
    .fill("Versão alterada depois da visita");
  await page
    .getByRole("checkbox", {
      name: "Conferi o conteúdo antes de publicar.",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Publicar alterações", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Editar música", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar na administração", exact: true }),
  ).toBeVisible();
  await page.goto(eventUrl);
  await page
    .getByRole("button", {
      name: "Visualizar letra de " + songTitle,
      exact: true,
    })
    .click();
  await expect(page.getByText(/Voz e coração/)).toBeVisible();
  await expect(
    page.getByText("Versão alterada depois da visita", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Acervo", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Evento mais recente", exact: true })
      .getByRole("link", { name: "Ver letras e cifras", exact: true }),
  ).toHaveAttribute("href", `#/events/${savedEvent.id}`);
  await page
    .getByRole("searchbox", { name: "Buscar título ou trecho", exact: true })
    .fill(songTitle);
  await expect(
    page.getByRole("heading", { name: songTitle, exact: true }),
  ).toBeVisible();
});
