// @vitest-environment node
import { it, expect, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { extractPdf } from "../../src/import/pdf";
import { PDFDocument, StandardFonts } from "pdf-lib";
vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));
it("preserves the first chord's indentation relative to the verse", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  const page = pdf.addPage();
  page.drawText("G", { x: 66.4, y: 700, size: 11, font });
  page.drawText("Voz e coracao", { x: 40, y: 684, size: 11, font });
  const result = await extractPdf(new Uint8Array(await pdf.save()).buffer);
  expect(result.text).toBe("    G\nVoz e coracao");
});
it("rebuilds positioned chord spacing and separate stanzas from a real PDF", async () => {
  const bytes = await readFile(
    new URL("../fixtures/cifra.pdf", import.meta.url),
  );
  const r = await extractPdf(new Uint8Array(bytes).buffer);
  expect(r.text).toContain("C   G");
  expect(r.text).toContain("Voz e coração");
  expect(r.text).toContain("\n\nNovo verso");
  expect(r.text).toContain("Canção de teste");
});
it("extracts no text from a blank page and rejects corrupt PDF bytes", async () => {
  const bytes = await readFile(
    new URL("../fixtures/vazio.pdf", import.meta.url),
  );
  expect((await extractPdf(new Uint8Array(bytes).buffer)).text).toBe("");
  await expect(
    extractPdf(new TextEncoder().encode("bad").buffer),
  ).rejects.toThrow();
});
