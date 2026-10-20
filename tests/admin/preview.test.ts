// @vitest-environment node
import { it, expect } from "vitest";
import { previewSongPdf } from "../../src/pdf/previewSong";
import { generateLyricsPdf } from "../../src/pdf/lyrics";
import { fixtureFonts } from "../pdf/fontFixtures";
it("allows a single administrative preview without relaxing public selection rules", async () => {
  const song = {
    title: "Canção",
    artist: "",
    kind: "lyrics" as const,
    content: "Uma voz",
  };
  expect(
    await previewSongPdf(
      song,
      { family: "sans", sizing: { mode: "auto" } },
      fixtureFonts,
    ),
  ).toMatchObject({ ok: true, pageCount: 1 });
  expect(
    (
      await generateLyricsPdf(
        [{ ...song, id: "one" }],
        { family: "sans", sizing: { mode: "auto" } },
        fixtureFonts,
      )
    ).ok,
  ).toBe(false);
});
