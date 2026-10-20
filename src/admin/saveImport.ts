import type { ImportItem } from "./batch";
import type { SongStatus, AdminSong, Song } from "../catalog/types";
import type { AdminRepository } from "../catalog/repository";
import { normalizeText } from "../import/normalize";
export async function saveImport(
  item: ImportItem,
  status: SongStatus,
  repo: AdminRepository,
): Promise<AdminSong> {
  const draft = {
    ...item.draft,
    title: item.draft.title.trim(),
    artist: item.draft.artist.trim(),
    content: normalizeText(item.draft.content),
  };
  if (!draft.title || !draft.content.trim())
    throw new Error("Preencha o título e o conteúdo da música.");
  if (status === "published" && !item.reviewed)
    throw new Error("Revise o conteúdo antes de publicar");
  const now = new Date().toISOString(),
    song: Song = {
      ...draft,
      id: item.id,
      status,
      createdAt: now,
      updatedAt: now,
    };
  const original = item.attachOriginal === false ? null : item.original;
  let uploadAttempted = false;
  const matches = (saved: AdminSong) =>
    saved.title === song.title &&
    saved.artist === song.artist &&
    saved.content === song.content &&
    saved.kind === song.kind &&
    saved.status === status;
  try {
    const previous = await repo.getAdmin(item.id);
    if (original && !previous?.original) {
      uploadAttempted = true;
      await repo.uploadOriginal(original, item.file);
    }
    return await repo.save(song, original);
  } catch {
    let known: AdminSong | null;
    try {
      known = await repo.getAdmin(item.id);
    } catch {
      throw new Error(
        "Não foi possível confirmar o resultado. Seus dados continuam aqui. Tente salvar novamente sem reimportar o arquivo.",
      );
    }
    if (known && matches(known)) return known;
    if (!known && uploadAttempted && original) {
      try {
        await repo.removeOriginal(original);
      } catch {
        throw new Error(
          "A gravação falhou e a limpeza do arquivo não foi confirmada. Seus dados continuam aqui para tentar novamente.",
        );
      }
    }
    throw new Error(
      "Não foi possível salvar. Seus dados continuam aqui para tentar novamente.",
    );
  }
}
