import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { createDemoRepository } from "../src/catalog/demoRepository.ts";
const raw = spawnSync("node_modules/.bin/supabase", ["status", "-o", "json"], {
  encoding: "utf8",
});
if (raw.status !== 0)
  throw Error("Supabase local necessário para preparar E2E.");
const config = JSON.parse(raw.stdout),
  url = config.API_URL,
  dbUrl = config.DB_URL;
if (
  ![url, dbUrl].every(
    (value) =>
      value && ["127.0.0.1", "localhost"].includes(new URL(value).hostname),
  )
)
  throw Error("E2E só pode usar serviços locais.");
const service = createClient(url, config.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = "admin@acervo.local.test",
  password = "Local-Musical-Test-2026!";
const users = await service.auth.admin.listUsers();
if (users.error) throw users.error;
let user = users.data.users.find((u) => u.email === email);
if (!user) {
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  user = created.data.user;
}
const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
await db.query(
  "insert into private.app_admin(singleton,user_id) values(true,$1) on conflict(singleton) do update set user_id=excluded.user_id",
  [user.id],
);
await db.end();
const demo = createDemoRepository();
const songs = [
  ...(await demo.listPublished({ kind: "lyrics", search: "" })),
  ...(await demo.listPublished({ kind: "chords", search: "" })),
];
const lyricSample = songs.find((song) => song.kind === "lyrics");
songs.push(
  ...Array.from({ length: 5 }, (_, i) => ({
    ...lyricSample,
    title: "Letra extra " + (i + 5),
    content: "Verso de teste\n\nOutra estrofe",
  })),
);
const rows = songs.map((song, i) => ({
  id: "00000000-0000-4000-8000-" + String(i + 1).padStart(12, "0"),
  title: song.title,
  artist: song.artist,
  kind: song.kind,
  content: song.content,
  status: song.status,
}));
const result = await service.from("songs").upsert(rows);
if (result.error) throw result.error;
await writeFile(
  ".env.e2e.local",
  "VITE_SUPABASE_URL=" +
    url +
    "\nVITE_SUPABASE_PUBLISHABLE_KEY=" +
    config.ANON_KEY +
    "\nVITE_BASE_PATH=/acervo-musical/\n",
);
console.log(
  "Ambiente E2E local preparado. Somente parâmetros públicos gravados.",
);
