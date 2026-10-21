import type { Song } from "../../src/catalog/types";
import type { ArchiveEvent, EventRepository } from "../../src/events/types";
import {
  snapshotSelection,
  sortEvents,
  validateEvent,
} from "../../src/events/model";
export function memoryEvents(catalog: () => Song[] = () => []) {
  const records = new Map<string, ArchiveEvent>();
  const state = { fail: false };
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  const repo: EventRepository = {
    listAdmin: async () => sortEvents([...records.values()]).map(copy),
    listPublished: async () =>
      sortEvents(
        [...records.values()].filter((e) => e.status === "published"),
      ).map(copy),
    latestPublished: async () => (await repo.listPublished())[0] ?? null,
    getAdmin: async (id) => (records.has(id) ? copy(records.get(id)!) : null),
    getPublished: async (id) =>
      records.get(id)?.status === "published" ? copy(records.get(id)!) : null,
    save: async (input) => {
      if (state.fail) throw Error("Falha de teste");
      const invalid = validateEvent(input);
      if (invalid) throw Error(invalid);
      const previous = records.get(input.id);
      const value = {
        id: input.id,
        title: input.title.trim(),
        date: input.date,
        status: input.status,
        songs: snapshotSelection(input.songIds, catalog(), previous?.songs),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.set(input.id, copy(value));
      return copy(value);
    },
    remove: async (id) => {
      records.delete(id);
    },
  };
  return { repo, records, state };
}
