import type { CatalogRepository } from "../catalog/repository";
import type { ArchiveEvent, PublicEventRepository } from "./types";
export function createDemoEvents(
  catalog: CatalogRepository,
): PublicEventRepository {
  async function sample(): Promise<ArchiveEvent> {
    return {
      id: "visita-exemplo",
      title: "Visita de exemplo",
      date: "2026-10-16",
      status: "published",
      createdAt: "2026-10-16T12:00:00Z",
      updatedAt: "2026-10-16T12:00:00Z",
      songs: [
        ...(await catalog.listPublished({ kind: "lyrics", search: "" })),
        ...(await catalog.listPublished({ kind: "chords", search: "" })),
      ].map(({ id, title, artist, kind, content }) => ({
        id,
        title,
        artist,
        kind,
        content,
      })),
    };
  }
  return {
    latestPublished: sample,
    listPublished: async () => [await sample()],
    getPublished: async (id) => (id === "visita-exemplo" ? sample() : null),
  };
}
