// @vitest-environment node
import { it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRepository } from "../../src/backend/supabaseRepository";
import type { Song } from "../../src/catalog/types";
it("marks a server rejection as definitive while keeping transport failures ambiguous", async () => {
  const song: Song = {
    id: "test",
    title: "Teste",
    artist: "",
    kind: "lyrics",
    content: "Voz",
    status: "draft",
    createdAt: "",
    updatedAt: "",
  };
  const client = (fetch: typeof globalThis.fetch) =>
    createClient("https://example.supabase.co", "public-test", {
      auth: { persistSession: false },
      global: { fetch },
    });
  const rejected = createSupabaseRepository(
    client(
      async () =>
        new Response(
          JSON.stringify({ code: "23514", message: "constraint failed" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
    ),
  );
  await expect(rejected.save(song, null)).rejects.toHaveProperty(
    "name",
    "ConfirmedWriteRejection",
  );
  const offline = createSupabaseRepository(
    client(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  await expect(offline.save(song, null)).rejects.not.toHaveProperty(
    "name",
    "ConfirmedWriteRejection",
  );
});
it("searches subsequent API pages and exposes no original references publicly", async () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({
    id: String(i),
    title: "Outros " + i,
    artist: "",
    kind: "lyrics",
    content: "Texto",
    status: "published",
    created_at: "2026-10-20",
    updated_at: "2026-10-20",
  }));
  const paths: string[] = [];
  const client = createClient("https://example.supabase.co", "public-test", {
    auth: { persistSession: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        paths.push(url.search);
        const offset = url.searchParams.get("offset");
        const data =
          offset === "500"
            ? [
                {
                  ...rows[0],
                  id: "501",
                  title: "Canção final",
                  content: "Um trecho escondido\nentre versos",
                  original: { path: "private" },
                },
              ]
            : rows;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  const repo = createSupabaseRepository(client);
  const result = await repo.listPublished({
    kind: "lyrics",
    search: "TRECHO ESCONDIDO ENTRE VERSOS",
  });
  expect(result.map((s) => s.title)).toEqual(["Canção final"]);
  expect(result[0]).not.toHaveProperty("original");
  expect(paths).toHaveLength(2);
});
