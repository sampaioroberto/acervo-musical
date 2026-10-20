import type { Song, CatalogQuery } from "./types";
export function searchable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
export function filterSongs(songs: Song[], query: CatalogQuery): Song[] {
  const normalized = (text: string) => searchable(text).replace(/\s+/gu, " ");
  const term = normalized(query.search);
  return songs
    .filter(
      (s) =>
        s.status === "published" &&
        s.kind === query.kind &&
        (normalized(s.title).includes(term) ||
          normalized(s.content).includes(term)),
    )
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title, "pt-BR") || a.id.localeCompare(b.id),
    );
}
