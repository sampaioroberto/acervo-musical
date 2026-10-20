// @vitest-environment node
import { it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateLyricsPdf } from "../../src/pdf/lyrics";
import { makePrintSongs } from "./fixtures";
import { fixtureFonts } from "./fontFixtures";
import type { FontFamily } from "../../src/pdf/types";
import { textFonts } from "./textFonts";
import { pdfContents } from "./pdfContents";
for (const family of ["sans", "serif", "mono"] as FontFamily[])
  it("prints four accented lyrics in one A4 page using " + family, async () => {
    const r = await generateLyricsPdf(
      makePrintSongs("lyrics", "Canção\nVoz e coração\n\nUma nova manhã"),
      { family, sizing: { mode: "manual", size: 16 } },
      fixtureFonts,
    );
    expect(r).toMatchObject({ ok: true, pageCount: 1, fontSize: 16 });
    if (!r.ok) return;
    const pdf = await PDFDocument.load(r.bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.2756, 3);
    expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.8898, 3);
    const fonts = textFonts(pdf);
    expect(fonts[0]).toContain("Bold");
    expect(fonts[1]).toContain("Regular");
  });
it("finds a smaller font when sixteen does not fit and rejects overflow at nine", async () => {
  const songs = makePrintSongs(
    "lyrics",
    Array(25).fill("Uma linha da canção").join("\n"),
  );
  const r = await generateLyricsPdf(
    songs,
    { family: "sans", sizing: { mode: "auto" } },
    fixtureFonts,
  );
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.fontSize).toBeLessThan(16);
    expect(r.fontSize).toBeGreaterThanOrEqual(9);
  }
  const manual = await generateLyricsPdf(
    songs,
    { family: "sans", sizing: { mode: "manual", size: 16 } },
    fixtureFonts,
  );
  expect(manual.ok).toBe(false);
  const huge = await generateLyricsPdf(
    makePrintSongs("lyrics", "Verso\n".repeat(200)),
    { family: "sans", sizing: { mode: "auto" } },
    fixtureFonts,
  );
  expect(huge).toMatchObject({
    ok: false,
    issues: [
      expect.objectContaining({ code: "overflow", column: 0 }),
      expect.objectContaining({ code: "overflow", column: 1 }),
    ],
  });
});
it.each([1, 2, 3, 5, 8, 9])(
  "prints %i lyrics in ordered groups of four per A4 sheet",
  async (count) => {
    const sample = makePrintSongs("lyrics", "Verso")[0];
    const songs = Array.from({ length: count }, (_, i) => ({
      ...sample,
      id: String(i + 1),
      title: "Música " + (i + 1),
    })).reverse();
    const result = await generateLyricsPdf(
      songs,
      { family: "sans", sizing: { mode: "auto" } },
      fixtureFonts,
    );
    expect(result).toMatchObject({ ok: true, pageCount: Math.ceil(count / 4) });
    if (!result.ok) return;
    const pages = await pdfContents(result.bytes);
    expect(pages).toHaveLength(Math.ceil(count / 4));
    for (const [i, page] of pages.entries()) {
      const titles = page.filter((part) => part.text.startsWith("Música "));
      expect(titles.map((t) => t.text)).toEqual(
        songs.slice(i * 4, i * 4 + 4).map((s) => s.title),
      );
      if (titles.length > 1) {
        expect(titles[0].x).toBeCloseTo(titles[1].x);
        expect(titles[0].y).toBeGreaterThan(titles[1].y);
      }
      if (titles.length > 2)
        expect(titles[2].x).toBeGreaterThan(titles[0].x + 200);
    }
  },
);
it("checks fitting and overflow on later lyric sheets", async () => {
  const sample = makePrintSongs("lyrics", "Verso")[0];
  const songs = Array.from({ length: 5 }, (_, i) => ({
    ...sample,
    id: String(i + 1),
  }));
  songs[4].content = "Uma linha da canção\n".repeat(45);
  const fit = await generateLyricsPdf(
    songs,
    { family: "sans", sizing: { mode: "auto" } },
    fixtureFonts,
  );
  expect(fit.ok).toBe(true);
  if (fit.ok) expect(fit.fontSize).toBeLessThan(16);
  songs[4].content = "Verso\n".repeat(200);
  const overflow = await generateLyricsPdf(
    songs,
    { family: "sans", sizing: { mode: "auto" } },
    fixtureFonts,
  );
  expect(overflow).toMatchObject({
    ok: false,
    issues: [
      expect.objectContaining({
        songIds: ["5"],
        message: expect.stringContaining("página 2"),
      }),
    ],
  });
});
it("rejects invalid sizes, empty or duplicate selections, mixed kinds and missing glyphs", async () => {
  for (const size of [8, 17, NaN, 9.5])
    expect(
      (
        await generateLyricsPdf(
          makePrintSongs("lyrics", "Verso"),
          { family: "sans", sizing: { mode: "manual", size } },
          fixtureFonts,
        )
      ).ok,
    ).toBe(false);
  expect(
    (
      await generateLyricsPdf(
        [],
        { family: "sans", sizing: { mode: "auto" } },
        fixtureFonts,
      )
    ).ok,
  ).toBe(false);
  const duplicate = makePrintSongs("lyrics", "Verso");
  expect(
    (
      await generateLyricsPdf(
        [duplicate[0], duplicate[0]],
        { family: "sans", sizing: { mode: "auto" } },
        fixtureFonts,
      )
    ).ok,
  ).toBe(false);
  expect(
    (
      await generateLyricsPdf(
        makePrintSongs("chords", "C"),
        { family: "sans", sizing: { mode: "auto" } },
        fixtureFonts,
      )
    ).ok,
  ).toBe(false);
  const glyph = await generateLyricsPdf(
    makePrintSongs("lyrics", "Verso 🦄"),
    { family: "sans", sizing: { mode: "auto" } },
    fixtureFonts,
  );
  expect(glyph).toMatchObject({
    ok: false,
    issues: [expect.objectContaining({ code: "unsupported-character" })],
  });
});
