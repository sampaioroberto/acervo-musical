import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
export type Access = "anonymous" | "admin" | "denied";
export interface AuthPort {
  current(): Promise<Access>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  subscribe(listener: () => void): () => void;
}
export function createAuth(client: SupabaseClient<Database>): AuthPort {
  return {
    current: async () => {
      const session = await client.auth.getSession();
      if (session.error || !session.data.session) return "anonymous";
      const role = await client.rpc("is_admin");
      if (role.error)
        throw new Error(
          "Não foi possível verificar seu acesso. Tente novamente.",
        );
      return role.data === true ? "admin" : "denied";
    },
    signIn: async (email, password) => {
      const response = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (response.error)
        throw new Error(
          "Não foi possível entrar. Confira seu e-mail e sua senha.",
        );
    },
    signOut: async () => {
      const response = await client.auth.signOut({ scope: "local" });
      if (response.error)
        throw new Error("Não foi possível encerrar a sessão.");
    },
    subscribe: (listener) => {
      const { data } = client.auth.onAuthStateChange(() =>
        queueMicrotask(listener),
      );
      return () => data.subscription.unsubscribe();
    },
  };
}
