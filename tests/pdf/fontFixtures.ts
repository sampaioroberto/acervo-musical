import { readFile } from "node:fs/promises";
import type { FontSource } from "../../src/pdf/types";
const names = { sans: "NotoSans", serif: "NotoSerif", mono: "NotoSansMono" };
export const fixtureFonts: FontSource = async (family) =>
  new Uint8Array(
    await readFile(
      new URL(
        "../../public/fonts/" + names[family] + "-Regular.ttf",
        import.meta.url,
      ),
    ),
  );
