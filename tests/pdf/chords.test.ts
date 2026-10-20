// @vitest-environment node
import { it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateChordsPdf } from "../../src/pdf/chords";
import { normalizeText } from "../../src/import/normalize";
import { fixtureFonts } from "./fontFixtures";
import { makePrintSongs } from "./fixtures";
import { textFonts } from "./textFonts";
it("starts short chord sheets on four separate pages and preserves tabs", async () => {
  const r = await generateChordsPdf(
    makePrintSongs("chords", "C   G\nVoz e coração"),
    fixtureFonts,
  );
  expect(r).toMatchObject({ ok: true, pageCount: 4, fontSize: 11 });
  if (r.ok) expect((await PDFDocument.load(r.bytes)).getPageCount()).toBe(4);
  expect(normalizeText("C\tG\r\nvoz")).toBe("C   G\nvoz");
});
it("continues a long song and starts the next song after it without blank pages", async () => {
  const songs = makePrintSongs("chords", "C    G\nVerso");
  songs[0].content = "C    G\n".repeat(80);
  const r = await generateChordsPdf(songs, fixtureFonts);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.pageCount).toBe(5);
    const pdf = await PDFDocument.load(r.bytes);
    for (let i = 0; i < pdf.getPageCount(); i++) {
      const fonts = textFonts(pdf, i);
      expect(fonts[0]).toContain("Bold");
      expect(fonts[1]).toContain("Regular");
    }
  }
});
it("does not wrap an overwide line or omit unsupported characters", async () => {
  const r = await generateChordsPdf(
    makePrintSongs("chords", "C".repeat(200)),
    fixtureFonts,
  );
  expect(r).toMatchObject({
    ok: false,
    issues: [expect.objectContaining({ code: "overflow" })],
  });
  const glyph = await generateChordsPdf(
    makePrintSongs("chords", "🦄"),
    fixtureFonts,
  );
  expect(glyph.ok).toBe(false);
});
it("wraps long headings and handles an optional artist", async () => {
  const songs = makePrintSongs("chords", "C\nVoz");
  songs[0].title = "Um título comprido ".repeat(10);
  songs[0].artist = "";
  const r = await generateChordsPdf(songs, fixtureFonts);
  expect(r).toMatchObject({ ok: true, pageCount: 4 });
});
