import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { pdfContents } from "../tests/pdf/pdfContents";
test("downloads exactly one lyric page and four chord pages", async ({
  page,
}) => {
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
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF" }).click();
  const file = await download;
  const doc = await PDFDocument.load(await readFile((await file.path())!));
  expect(doc.getPageCount()).toBe(1);
  await page.getByRole("button", { name: "Fechar prévia" }).click();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cifras", exact: true }).click();
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
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  const chordDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF" }).click();
  const chordFile = await chordDownload;
  expect(
    (
      await PDFDocument.load(await readFile((await chordFile.path())!))
    ).getPageCount(),
  ).toBe(4);
});

test("downloads one lyric or nine reordered lyrics across three sheets", async ({
  page,
}) => {
  const titles = [
    "Caminho das águas",
    "Canção do amanhecer",
    "Casa de vento",
    "Horizonte sereno",
    ...[5, 6, 7, 8, 9].map((n) => "Letra extra " + n),
  ];
  await page.goto("./");
  await page
    .getByRole("button", { name: "Selecionar " + titles[0], exact: true })
    .click();
  await page.getByRole("button", { name: "Gerar PDF" }).click();
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  const singleDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF" }).click();
  const singleFile = await singleDownload;
  expect(
    (
      await PDFDocument.load(await readFile((await singleFile.path())!))
    ).getPageCount(),
  ).toBe(1);
  await page.getByRole("button", { name: "Fechar prévia" }).click();
  for (const title of titles.slice(1))
    await page
      .getByRole("button", { name: "Selecionar " + title, exact: true })
      .click();
  await expect(page.getByRole("button", { name: /^Retirar / })).toHaveCount(9);
  await page
    .getByRole("button", { name: "Subir Letra extra 5", exact: true })
    .click();
  const expected = [...titles];
  [expected[3], expected[4]] = [expected[4], expected[3]];
  await page.getByRole("button", { name: "Gerar PDF" }).click();
  await expect(page.getByText("9 letras · 3 folhas A4")).toBeVisible();
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF" }).click();
  const file = await download;
  const pages = await pdfContents(await readFile((await file.path())!));
  expect(pages).toHaveLength(3);
  expect(
    pages.map((parts) =>
      parts.filter((p) => titles.includes(p.text)).map((p) => p.text),
    ),
  ).toEqual([expected.slice(0, 4), expected.slice(4, 8), expected.slice(8)]);
  await expect(page.getByText("Página 1 de 3", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Página 2 do PDF" }),
  ).toBeVisible();
});
