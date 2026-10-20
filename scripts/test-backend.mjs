import { spawnSync } from "node:child_process";
const status = spawnSync(
  "node_modules/.bin/supabase",
  ["status", "-o", "json"],
  { encoding: "utf8" },
);
if (status.status !== 0) {
  console.error(
    "Supabase local indisponível. Execute npm run backend:start com Docker em execução.",
  );
  process.exit(1);
}
let config;
try {
  config = JSON.parse(status.stdout);
} catch {
  console.error("Resposta inválida do Supabase CLI.");
  process.exit(1);
}
const url = config.API_URL ?? config.api_url;
const db = config.DB_URL ?? config.db_url;
if (
  !url ||
  !db ||
  ![new URL(url).hostname, new URL(db).hostname].every((h) =>
    ["127.0.0.1", "localhost", "[::1]"].includes(h),
  )
) {
  console.error("Testes de acesso só podem usar Supabase local.");
  process.exit(1);
}
const env = {
  ...process.env,
  ACERVO_TEST_URL: url,
  ACERVO_TEST_DB: db,
  ACERVO_TEST_ANON: config.ANON_KEY ?? config.anon_key,
  ACERVO_TEST_SERVICE: config.SERVICE_ROLE_KEY ?? config.service_role_key,
};
const result = spawnSync(
  "node_modules/.bin/vitest",
  ["run", "--config", "vitest.integration.config.ts"],
  { env, stdio: "inherit" },
);
process.exit(result.status ?? 1);
