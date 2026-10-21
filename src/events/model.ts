import type { Song } from "../catalog/types";
import type { EventInput, EventSong } from "./types";
import { searchable } from "../catalog/search";
export function songTitleKey(title: string) {
  return searchable(title).replace(/\s+/gu, " ");
}
export function moveEventSong(
  selection: EventSong[],
  id: string,
  delta: number,
): EventSong[] {
  const song = selection.find((item) => item.id === id);
  if (!song) return selection;
  const positions = selection.flatMap((item, index) =>
    item.kind === song.kind ? [index] : [],
  );
  const from = positions.findIndex((index) => selection[index].id === id);
  const to = from + delta;
  if (to < 0 || to >= positions.length) return selection;
  // Pair repeated titles by occurrence before moving, keeping distinct versions.
  const counterparts = new Map<string, string[]>();
  selection
    .filter((item) => item.kind !== song.kind)
    .forEach((item) => {
      const key = songTitleKey(item.title);
      const queue = counterparts.get(key) ?? [];
      queue.push(item.id);
      counterparts.set(key, queue);
    });
  const pairedIds = new Map<string, string>();
  positions.forEach((index) => {
    const source = selection[index];
    const counterpart = counterparts.get(songTitleKey(source.title))?.shift();
    if (counterpart) pairedIds.set(source.id, counterpart);
  });
  const next = [...selection];
  [next[positions[from]], next[positions[to]]] = [
    next[positions[to]],
    next[positions[from]],
  ];
  const ranks = new Map<string, number>();
  next
    .filter((item) => item.kind === song.kind)
    .forEach((item) => {
      const counterpartId = pairedIds.get(item.id);
      if (counterpartId) ranks.set(counterpartId, ranks.size);
    });
  const pairedPositions = next.flatMap((item, index) =>
    item.kind !== song.kind && ranks.has(item.id) ? [index] : [],
  );
  const pairedSongs = pairedPositions
    .map((index) => next[index])
    .sort((a, b) => ranks.get(a.id)! - ranks.get(b.id)!);
  pairedPositions.forEach((index, i) => {
    next[index] = pairedSongs[i];
  });
  return next;
}
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
