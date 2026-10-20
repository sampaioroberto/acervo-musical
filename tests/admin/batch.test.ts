import { it, expect } from "vitest";
import {
  createImportItem,
  createManualItem,
  duplicateIds,
} from "../../src/admin/batch";
it("creates one stable import identity with an opaque path independent of filename", () => {
  const item = createImportItem(
    new File(["%PDF-"], "Minha música.PDF"),
    "lyrics",
  );
  expect(item.original.id).toBe(item.id);
  expect(item.original.path).toBe(item.id + "/original.pdf");
  expect(item.draft.title).toBe("Minha música");
  expect(item.reviewed).toBe(false);
});
it("does not warn about duplicates until a manual title is filled", () => {
  const a = createManualItem("lyrics"),
    b = createManualItem("lyrics");
  b.draft.title = "   ";
  expect([...duplicateIds([], [a, b])]).toEqual([]);
  a.draft.title = "Canção";
  b.draft.title = "Cancao";
  expect([...duplicateIds([], [a, b])]).toEqual([a.id, b.id]);
});
it("warns about normalized duplicates in the catalog and within the batch", () => {
  const a = createImportItem(new File(["x"], "Canção.pdf"), "lyrics");
  const b = createImportItem(new File(["x"], "Cancao.pdf"), "lyrics");
  expect([...duplicateIds([], [a, b])]).toEqual([a.id, b.id]);
  b.draft.kind = "chords";
  expect([...duplicateIds([], [a, b])]).toEqual([]);
  expect([...duplicateIds([{ ...a.draft, id: "existing" }], [a])]).toEqual([
    a.id,
  ]);
});
