import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types";
import type { AdminRepository } from "../catalog/repository";
import { ConfirmedWriteRejection } from "../catalog/repository";
import type { Song, AdminSong, OriginalRef } from "../catalog/types";
import { filterSongs } from "../catalog/search";
type SongRow = {
  id: string;
  title: string;
  artist: string;
  kind: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  original?: OriginalRef | null;
  song_originals?: OriginalRef[];
};
const columns = "id,title,artist,kind,content,status,created_at,updated_at";
function song(row: SongRow): Song {
  if (
    !["lyrics", "chords"].includes(row.kind) ||
    !["published", "draft"].includes(row.status)
  )
    throw new Error("Registro de música inválido.");
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? "",
    kind: row.kind as Song["kind"],
    content: row.content,
    status: row.status as Song["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function adminSong(row: SongRow): AdminSong {
  return {
    ...song(row),
    original: row.original ?? row.song_originals?.[0] ?? null,
  };
}
function checked<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error;
  return data;
}
export function createSupabaseRepository(
  client: SupabaseClient<Database>,
): AdminRepository {
  async function allRows(admin = false, kind?: Song["kind"]) {
    const rows: SongRow[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = client
        .from("songs")
        .select(
          admin ? columns + ",song_originals(id,path,name,mime,size)" : columns,
        )
        .order("title")
        .order("id")
        .range(offset, offset + 499);
      if (!admin) query = query.eq("status", "published");
      if (kind) query = query.eq("kind", kind);
      const page = checked(await query) as unknown as SongRow[];
      rows.push(...page);
      if (page.length < 500) break;
    }
    return rows;
  }
  return {
    listPublished: async (query) =>
      filterSongs((await allRows(false, query.kind)).map(song), query),
    listAdmin: async () => (await allRows(true)).map(adminSong),
    getAdmin: async (id) => {
      const row = checked(
        await client
          .from("songs")
          .select(columns + ",song_originals(id,path,name,mime,size)")
          .eq("id", id)
          .maybeSingle(),
      ) as unknown as SongRow | null;
      return row ? adminSong(row) : null;
    },
    save: async (value, original) => {
      const response = await client.rpc("save_song", {
        p_song: value as unknown as Json,
        p_original: original as unknown as Json,
      });
      // Transport failures and server/gateway errors may hide a late commit.
      // Only a structured client-error response establishes a rejected write.
      if (
        response.error &&
        response.status >= 400 &&
        response.status < 500 &&
        /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(response.error.code)
      )
        throw new ConfirmedWriteRejection(response.error.message);
      const row = checked(response);
      return adminSong(row as unknown as SongRow);
    },
    deleteSong: async (id) =>
      checked(
        await client.rpc("delete_song", { p_id: id }),
      ) as unknown as OriginalRef | null,
    uploadOriginal: async (ref, file) => {
      checked(
        await client.storage
          .from("originals")
          .upload(ref.path, file, { upsert: true, contentType: ref.mime }),
      );
    },
    removeOriginal: async (ref) => {
      const linked = checked(
        await client
          .from("song_originals")
          .select("song_id")
          .eq("id", ref.id)
          .maybeSingle(),
      ) as { song_id: string | null } | null;
      if (linked?.song_id)
        throw new Error("Este arquivo ainda está associado a uma música.");
      checked(await client.storage.from("originals").remove([ref.path]));
      checked(
        await client
          .from("song_originals")
          .delete()
          .eq("id", ref.id)
          .is("song_id", null),
      );
    },
    listPendingCleanup: async () =>
      checked(
        await client
          .from("song_originals")
          .select("id,path,name,mime,size")
          .is("song_id", null)
          .eq("pending_cleanup", true),
      ) as unknown as OriginalRef[],
  };
}
