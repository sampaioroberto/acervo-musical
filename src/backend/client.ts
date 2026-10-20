import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { createSupabaseRepository } from "./supabaseRepository";
import { createAuth } from "./auth";
import { createEventRepository } from "./eventRepository";
export function createBackend(config: { url: string; publishableKey: string }) {
  const client = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return {
    repository: createSupabaseRepository(client),
    events: createEventRepository(client),
    auth: createAuth(client),
  };
}
