import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types";
import type {
  ArchiveEvent,
  EventInput,
  EventRepository,
  EventSummary,
  EventSong,
} from "../events/types";
import { validateEvent } from "../events/model";
type Row = Database["public"]["Tables"]["events"]["Row"];
const columns = "id,title,event_date,status,created_at,updated_at";
function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
function summary(row: Omit<Row, "songs">): EventSummary {
  if (!["draft", "published"].includes(row.status))
    throw Error("Evento inválido.");
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    status: row.status as EventSummary["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function event(row: Row): ArchiveEvent {
  if (!Array.isArray(row.songs)) throw Error("Músicas do evento inválidas.");
  const songs: EventSong[] = row.songs.map((value) => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      typeof value.id !== "string" ||
      typeof value.title !== "string" ||
      typeof value.content !== "string" ||
      !["lyrics", "chords"].includes(String(value.kind))
    )
      throw Error("Música do evento inválida.");
    return {
      id: value.id,
      title: value.title,
      content: value.content,
      artist: typeof value.artist === "string" ? value.artist : "",
      kind: value.kind as EventSong["kind"],
    };
  });
  return { ...summary(row), songs };
}
export function createEventRepository(
  client: SupabaseClient<Database>,
): EventRepository {
  async function list(admin = false, latest = false): Promise<EventSummary[]> {
    const rows: EventSummary[] = [];
    for (let offset = 0; ; offset += 500) {
      let request = client
        .from("events")
        .select(columns)
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (!admin) request = request.eq("status", "published");
      const page = checked(
        await request.range(offset, latest ? 0 : offset + 499),
      ) as Omit<Row, "songs">[];
      rows.push(...page.map(summary));
      if (latest || page.length < 500) break;
    }
    return rows;
  }
  async function get(id: string, admin = false): Promise<ArchiveEvent | null> {
    let request = client
      .from("events")
      .select(columns + ",songs")
      .eq("id", id);
    if (!admin) request = request.eq("status", "published");
    const row = checked(await request.maybeSingle()) as Row | null;
    return row ? event(row) : null;
  }
  return {
    listPublished: () => list(),
    latestPublished: async () => (await list(false, true))[0] ?? null,
    getPublished: (id) => get(id),
    listAdmin: () => list(true),
    getAdmin: (id) => get(id, true),
    save: async (input: EventInput) => {
      const invalid = validateEvent(input);
      if (invalid) throw Error(invalid);
      const result = await client.rpc("save_event", {
        p_event: {
          id: input.id,
          title: input.title.trim(),
          date: input.date,
          status: input.status,
        },
        p_song_ids: input.songIds,
      });
      if (!result.error) return event(result.data as unknown as Row);
      try {
        const known = await get(input.id, true);
        if (
          known &&
          known.title === input.title.trim() &&
          known.date === input.date &&
          known.status === input.status &&
          JSON.stringify(known.songs.map((s) => s.id)) ===
            JSON.stringify(input.songIds)
        )
          return known;
      } catch {
        /* Keep the original editor and ID for an uncertain write. */
      }
      throw Error(
        "Não foi possível confirmar a gravação do evento. Seus dados continuam aqui; tente salvar novamente.",
      );
    },
    remove: async (id) => {
      checked(await client.rpc("delete_event", { p_id: id }));
    },
  };
}
