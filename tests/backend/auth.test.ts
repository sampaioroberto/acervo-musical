import { it, expect } from "vitest";
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import type { Database } from "../../src/backend/database.types";
import { createAuth, type AuthChange } from "../../src/backend/auth";
it("distinguishes a new identity from the same user's token renewal", async () => {
  let notify: (
    event: AuthChangeEvent,
    session: Session | null,
  ) => void = () => {};
  const client = {
    auth: {
      onAuthStateChange: (callback: typeof notify) => {
        notify = callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  } as unknown as SupabaseClient<Database>;
  const changes: (AuthChange | undefined)[] = [];
  const unsubscribe = createAuth(client).subscribe((change) =>
    changes.push(change),
  );
  const session = (id: string) => ({ user: { id } }) as Session;
  notify("INITIAL_SESSION", session("admin"));
  notify("TOKEN_REFRESHED", session("admin"));
  notify("SIGNED_IN", session("admin"));
  notify("SIGNED_IN", session("other"));
  notify("SIGNED_OUT", null);
  await Promise.resolve();
  expect(changes.map((c) => c?.identityChanged)).toEqual([
    true,
    false,
    false,
    true,
    true,
  ]);
  unsubscribe();
});
