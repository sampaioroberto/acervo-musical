// @vitest-environment node
import { it, expect, vi } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { importPdfPages } from "../../src/import/pdfPages";
import { extractPdf } from "../../src/import/pdf";
vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));

export async function pdfFile() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  for (const [title, content] of [
    ["Caminho", "C   G\nPrimeiro verso"],
    ["Caminho (continuacao)", "Am  F\nSegundo verso"],
    ["Outra cancao", "D   A\nOutra voz"],
    ["", ""],
  ]) {
    const page = pdf.addPage();
    if (title) page.drawText(title, { font, size: 16, x: 40, y: 780 });
    if (content)
      page.drawText(content, { font, size: 11, x: 40, y: 740, lineHeight: 14 });
  }
  return new File([new Uint8Array(await pdf.save())], "Visita.pdf", {
    type: "application/pdf",
  });
}
it("imports every PDF page independently with a title and page-specific original", async () => {
  const pages = await importPdfPages(await pdfFile(), "chords");
  expect(pages).toHaveLength(4);
  expect(pages.map((p) => p.number)).toEqual([1, 2, 3, 4]);
  expect(pages[0].draft).toMatchObject({
    title: "Caminho",
    content: "C   G\nPrimeiro verso",
    kind: "chords",
  });
  expect(pages[1].continuation).toBe(true);
  expect(pages[2].draft.title).toBe("Outra cancao");
  expect(pages[3].draft.content).toBe("");
  expect(pages[3].warnings.join(" ")).toContain("texto");
  for (const page of pages)
    expect(
      (await PDFDocument.load(await page.file.arrayBuffer())).getPageCount(),
    ).toBe(1);
  const third = await extractPdf(await pages[2].file.arrayBuffer());
  expect(third.text).toContain("Outra voz");
  expect(third.text).not.toContain("Primeiro verso");
});
it("keeps a first chord line in the content when there is no title", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  pdf
    .addPage()
    .drawText("C   Am7  F#m\nSem titulo no arquivo", {
      font,
      x: 40,
      y: 740,
      size: 11,
      lineHeight: 14,
    });
  const pages = await importPdfPages(
    new File([new Uint8Array(await pdf.save())], "Sem titulo.pdf"),
    "chords",
  );
  expect(pages[0].heading).toBe(false);
  expect(pages[0].draft.content).toContain(
    "C   Am7  F#m\nSem titulo no arquivo",
  );
});
