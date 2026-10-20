import type { Song } from "../catalog/types";
import type { EventInput, EventSong } from "./types";
export function formatEventDate(date: string) {
  return date.split("-").reverse().join("/");
}
export function sortEvents<
  T extends { date: string; createdAt: string; id: string },
>(events: readonly T[]): T[] {
  return [...events].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}
export function validateEvent(input: EventInput): string | null {
  if (!input.title.trim() || input.title.trim().length > 180)
    return "Preencha o nome do evento (até 180 caracteres).";
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(input.date))
    return "Preencha uma data válida.";
  const date = new Date(input.date + "T12:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.date
  )
    return "Preencha uma data válida.";
  if (input.status === "published" && !input.songIds.length)
    return "Adicione ao menos uma música antes de publicar.";
  if (new Set(input.songIds).size !== input.songIds.length)
    return "Há uma música repetida no evento.";
  return null;
}
export function snapshotSelection(
  ids: readonly string[],
  catalog: readonly Song[],
  previous: readonly EventSong[] = [],
): EventSong[] {
  if (new Set(ids).size !== ids.length)
    throw Error("Há uma música repetida no evento.");
  return ids.map((id) => {
    const saved = previous.find((s) => s.id === id);
    if (saved) return { ...saved };
    const source = catalog.find((s) => s.id === id && s.status === "published");
    if (!source) throw Error("A música não está publicada no acervo.");
    return {
      id: source.id,
      title: source.title,
      artist: source.artist,
      kind: source.kind,
      content: source.content,
    };
  });
}
