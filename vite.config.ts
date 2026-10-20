import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { assertProductionConfig } from "./src/app/config.ts";
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  if (command === "build") assertProductionConfig(env);
  return { plugins: [react()], base: env.VITE_BASE_PATH || "/" };
});
