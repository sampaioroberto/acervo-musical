// @vitest-environment node
import { it, expect } from "vitest";
import { readConfig, assertProductionConfig } from "../../src/app/config";
const url = "https://example.supabase.co",
  key = "sb_publishable_example_for_test";
it("rejects privileged keys instead of embedding them in the website", () => {
  const jwt =
    "x." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".x";
  for (const secret of ["sb_secret_example", jwt])
    expect(() =>
      readConfig({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: secret,
      }),
    ).toThrow();
  expect(
    readConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key }),
  ).toMatchObject({ mode: "supabase" });
});
it("requires complete production credentials or an explicit demo flag", () => {
  expect(() => assertProductionConfig({})).toThrow();
  expect(() => assertProductionConfig({ VITE_DEMO: "false" })).toThrow();
  expect(() => assertProductionConfig({ VITE_DEMO: "true" })).not.toThrow();
  expect(() =>
    assertProductionConfig({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: key,
    }),
  ).not.toThrow();
  expect(() =>
    assertProductionConfig({ VITE_DEMO: "true", VITE_SUPABASE_URL: url }),
  ).toThrow();
});
