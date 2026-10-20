import { it, expect } from "vitest";
import { createImportItem, duplicateIds } from "../../src/admin/batch";
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
