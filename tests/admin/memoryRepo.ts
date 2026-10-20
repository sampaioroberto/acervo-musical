import type { AdminRepository } from "../../src/catalog/repository";
import { ConfirmedWriteRejection } from "../../src/catalog/repository";
import type { AdminSong } from "../../src/catalog/types";
import { filterSongs } from "../../src/catalog/search";
export function memoryRepo() {
  const records = new Map<string, AdminSong>(),
    files = new Set<string>();
  const state = {
    saveFailure: "none" as "none" | "before" | "after" | "unknown",
    unreachable: false,
  };
  const repo: AdminRepository = {
    listPublished: async (q) => filterSongs([...records.values()], q),
    listAdmin: async () => [...records.values()],
    getAdmin: async (id) => {
      if (state.unreachable) throw Error("offline");
      return records.get(id) ?? null;
    },
    save: async (song, original) => {
      if (state.saveFailure === "before")
        throw new ConfirmedWriteRejection("rejected");
      const saved = { ...song, original };
      records.set(song.id, saved);
      if (state.saveFailure === "unknown") state.unreachable = true;
      if (state.saveFailure === "after" || state.saveFailure === "unknown")
        throw Error("network");
      return saved;
    },
    deleteSong: async (id) => {
      const r = records.get(id);
      records.delete(id);
      return r?.original ?? null;
    },
    uploadOriginal: async (ref) => {
      files.add(ref.path);
    },
    removeOriginal: async (ref) => {
      files.delete(ref.path);
    },
    listPendingCleanup: async () => [],
  };
  return { repo, records, files, state };
}
