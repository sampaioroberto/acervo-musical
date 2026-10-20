import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174/acervo-musical/",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5174 --mode e2e",
    url: "http://127.0.0.1:5174/acervo-musical/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
