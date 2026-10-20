import type { PrintSong, FontSource, PdfResult, PdfIssue } from "./types";
import { normalizeText } from "../import/normalize";
import { createPdfFont, unsupportedGlyphs } from "./fonts";
import { PAGE, textBlock, drawLines } from "./text";
export async function generateChordsPdf(
  songs: readonly PrintSong[],
  fonts: FontSource,
): Promise<PdfResult> {
  if (
    songs.length !== 4 ||
    new Set(songs.map((s) => s.id)).size !== 4 ||
    songs.some((s) => s.kind !== "chords")
  )
    return {
      ok: false,
      issues: [
        {
          code: "selection",
          songIds: [],
          message: "Escolha quatro cifras diferentes para gerar o PDF.",
        },
      ],
    };
  return composeChords(songs, fonts);
}
export async function composeChords(
  songs: readonly PrintSong[],
  fonts: FontSource,
): Promise<PdfResult> {
  let context;
  try {
    context = await createPdfFont(fonts, "mono");
  } catch {
    return {
      ok: false,
      issues: [
        {
          code: "font-load",
          songIds: [],
          message: "Não foi possível carregar a fonte. Tente novamente.",
        },
      ],
    };
  }
  const { doc, font } = context;
  const width = PAGE.width - 2 * PAGE.margin;
  const normalized = songs.map((s) => ({
    ...s,
    title: normalizeText(s.title),
    artist: normalizeText(s.artist),
    content: normalizeText(s.content),
  }));
  const glyphs = unsupportedGlyphs(normalized, font);
  if (glyphs.length) return { ok: false, issues: glyphs };
  const wide = normalized.filter((s) =>
    s.content
      .split("\n")
      .some((line) => font.widthOfTextAtSize(line, 11) > width),
  );
  if (wide.length)
    return {
      ok: false,
      issues: [
        {
          code: "overflow",
          songIds: wide.map((s) => s.id),
          message:
            "Uma linha de cifra ultrapassa a largura da folha. Revise o alinhamento do conteúdo ou troque a seleção.",
        },
      ],
    };
  const heading = (song: PrintSong, continuation: boolean) => {
    const title = textBlock(
      song.title + (continuation ? " (continuação)" : ""),
      font,
      13.2,
      width,
    );
    const artist =
      song.artist && !continuation
        ? textBlock(song.artist, font, 9.9, width)
        : null;
    return {
      lines: [
        ...title.lines,
        ...(artist
          ? artist.lines.map((l) => ({ ...l, top: l.top + title.height + 5 }))
          : []),
      ],
      height: title.height + (artist ? artist.height + 5 : 0) + 12,
    };
  };
  const issues: PdfIssue[] = normalized
    .filter(
      (s) =>
        Math.max(heading(s, false).height, heading(s, true).height) +
          font.heightAtSize(11) >
        PAGE.height - 2 * PAGE.margin,
    )
    .map((s) => ({
      code: "overflow",
      songIds: [s.id],
      message:
        "O título ocupa espaço demais. Reduza o título antes de gerar o PDF.",
    }));
  if (issues.length) return { ok: false, issues };
  for (const song of normalized) {
    let page = doc.addPage([PAGE.width, PAGE.height]),
      top = PAGE.height - PAGE.margin;
    const addHeading = (continuation: boolean) => {
      const block = heading(song, continuation);
      drawLines(page, font, block.lines, PAGE.margin, top);
      top -= block.height;
    };
    addHeading(false);
    const lines = song.content.split("\n");
    while (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      if (top - font.heightAtSize(11) < PAGE.margin) {
        page = doc.addPage([PAGE.width, PAGE.height]);
        top = PAGE.height - PAGE.margin;
        addHeading(true);
      }
      drawLines(
        page,
        font,
        [{ text: line, size: 11, top: 0 }],
        PAGE.margin,
        top,
      );
      top -= 13.2;
    }
  }
  return {
    ok: true,
    bytes: await doc.save(),
    pageCount: doc.getPageCount(),
    fontSize: 11,
  };
}
