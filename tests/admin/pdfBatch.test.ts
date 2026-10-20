// @vitest-environment node
import { it, expect, vi } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { importPdfPages } from "../../src/import/pdfPages";
import {
  createPdfItems,
  canJoinNext,
  suggestsContinuation,
  joinPdfItems,
  splitPdfItem,
  splitNeedsConfirmation,
} from "../../src/admin/pdfBatch";
import { saveImport } from "../../src/admin/saveImport";
import { memoryRepo } from "./memoryRepo";
vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));

async function items() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  for (const text of [
    "Caminho\nC   G\nPrimeiro verso",
    "Caminho (continuacao)\nAm  F\nSegundo verso",
    "Outra cancao\nD   A\nOutra voz",
  ]) {
    pdf
      .addPage()
      .drawText(text, { font, x: 40, y: 780, size: 12, lineHeight: 18 });
  }
  const file = new File([new Uint8Array(await pdf.save())], "Visita.pdf", {
    type: "application/pdf",
  });
  return createPdfItems(file.name, await importPdfPages(file, "chords"));
}
it("suggests adjacent continuations and joins without sharing stored files", async () => {
  const [a, b, c] = await items();
  expect(canJoinNext(a, b)).toBe(true);
  expect(suggestsContinuation(a, b)).toBe(true);
  expect(suggestsContinuation(b, c)).toBe(false);
  const merged = await joinPdfItems(a, b);
  expect(merged.id).not.toBe(a.id);
  expect(merged.reviewed).toBe(false);
  expect(merged.draft.content).toBe(
    "C   G\nPrimeiro verso\n\nAm  F\nSegundo verso",
  );
  expect(
    (await PDFDocument.load(await merged.file!.arrayBuffer())).getPageCount(),
  ).toBe(2);
  const { repo, files, records } = memoryRepo();
  await saveImport({ ...merged, reviewed: true }, "published", repo);
  await saveImport({ ...c, reviewed: true }, "published", repo);
  expect(files.size).toBe(2);
  expect(records.get(merged.id)?.original?.path).not.toBe(
    records.get(c.id)?.original?.path,
  );
});
it("splits back into individual pages and signals when edits would be restored", async () => {
  const [a, b] = await items();
  const merged = await joinPdfItems(a, b);
  expect(splitNeedsConfirmation(merged)).toBe(false);
  const parts = splitPdfItem(merged);
  expect(parts.map((p) => p.draft.title)).toEqual([
    a.draft.title,
    b.draft.title,
  ]);
  expect(new Set(parts.map((p) => p.id)).size).toBe(2);
  merged.draft.content += "\nAjuste manual";
  expect(splitNeedsConfirmation(merged)).toBe(true);
  a.draft.content += "\nAjuste antes de juntar";
  const editedMerge = await joinPdfItems(a, b);
  expect(editedMerge.draft.content).toContain("Ajuste antes de juntar");
  expect(splitNeedsConfirmation(editedMerge)).toBe(true);
});
it("preserves a different following heading and never regroups attempted writes", async () => {
  const [a, b, c] = await items();
  expect(canJoinNext(a, c)).toBe(false);
  expect(canJoinNext(a, { ...b, pdf: { ...b.pdf!, sourceId: "other" } })).toBe(
    false,
  );
  const merged = await joinPdfItems(b, c);
  expect(merged.draft.content).toContain("Outra cancao\nD   A\nOutra voz");
  a.saveAttempted = true;
  expect(canJoinNext(a, b)).toBe(false);
  await expect(joinPdfItems(a, b)).rejects.toThrow();
  merged.saveAttempted = true;
  expect(() => splitPdfItem(merged)).toThrow();
});
