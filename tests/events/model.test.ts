import { it, expect } from "vitest";
import {
  snapshotSelection,
  validateEvent,
  formatEventDate,
  sortEvents,
} from "../../src/events/model";
import type { Song } from "../../src/catalog/types";
const song: Song = {
  id: "one",
  title: "Canção",
  artist: "",
  kind: "lyrics",
  content: "Versão do dia",
  status: "published",
  createdAt: "",
  updatedAt: "",
};
it("copies ordered published songs and preserves historical versions after source edits or deletion", () => {
  const original = snapshotSelection(["one"], [song]);
  song.content = "Alterada";
  expect(original[0].content).toBe("Versão do dia");
  expect(snapshotSelection(["one"], [], original)).toEqual(original);
  expect(() => snapshotSelection(["one", "one"], [song])).toThrow(/repetida/);
  expect(() => snapshotSelection(["missing"], [song])).toThrow(/publicada/);
  expect(() =>
    snapshotSelection(["one"], [{ ...song, status: "draft" }]),
  ).toThrow(/publicada/);
});
it("validates civil dates and requires songs only for publication", () => {
  const input = {
    id: "id",
    title: "Cora",
    date: "2026-05-16",
    status: "published" as const,
    songIds: ["one"],
  };
  expect(validateEvent(input)).toBeNull();
  expect(validateEvent({ ...input, date: "2026-02-30" })).toMatch(/data/);
  expect(validateEvent({ ...input, title: " " })).toMatch(/nome/);
  expect(validateEvent({ ...input, songIds: [] })).toMatch(/música/);
  expect(validateEvent({ ...input, songIds: [], status: "draft" })).toBeNull();
  expect(formatEventDate(input.date)).toBe("16/05/2026");
  expect(
    sortEvents([
      { id: "a", date: "2026-05-16", createdAt: "1" },
      { id: "b", date: "2026-06-01", createdAt: "1" },
    ]).map((e) => e.id),
  ).toEqual(["b", "a"]);
});
