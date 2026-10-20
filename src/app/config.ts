export type AppConfig =
  { mode: "demo" } | { mode: "supabase"; url: string; publishableKey: string };
function publicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const payload = key.split(".")[1];
    if (!payload) return false;
    return (
      JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ===
      "anon"
    );
  } catch {
    return false;
  }
}
export function readConfig(env: Record<string, string | undefined>): AppConfig {
  const url = env.VITE_SUPABASE_URL?.trim(),
    publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !publishableKey) return { mode: "demo" };
  if (!url || !publishableKey)
    throw new Error(
      "Configure a URL e a chave pública do Supabase para abrir o acervo.",
    );
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("A URL do Supabase é inválida.");
  }
  if (!["https:", "http:"].includes(parsed.protocol))
    throw new Error("A URL do Supabase é inválida.");
  if (!publicKey(publishableKey))
    throw new Error(
      "Use somente uma chave publishable ou anon pública do Supabase. Chaves privilegiadas não podem entrar no site.",
    );
  return { mode: "supabase", url, publishableKey };
}
export function assertProductionConfig(
  env: Record<string, string | undefined>,
): void {
  const config = readConfig(env);
  if (config.mode === "demo" && env.VITE_DEMO !== "true")
    throw new Error(
      "Configure o Supabase antes de publicar, ou defina VITE_DEMO=true para gerar uma demonstração explícita.",
    );
}
