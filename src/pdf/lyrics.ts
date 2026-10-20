import type {
  PrintSong,
  LyricOptions,
  FontSource,
  PdfResult,
  PdfIssue,
} from "./types";
import { createPdfFont, unsupportedGlyphs } from "./fonts";
import { PAGE, mm, textBlock, drawLines, type TextLine } from "./text";
import type { PDFFont } from "pdf-lib";
function songBlock(
  song: PrintSong,
  font: PDFFont,
  bold: PDFFont,
  size: number,
  width: number,
) {
  const lines: TextLine[] = [];
  let height = 0;
  for (const [text, scale, textFont] of [
    [song.title, 1.2, bold],
    [song.artist, 0.9, font],
    [song.content, 1, font],
  ] as const) {
    if (!text) continue;
    const block = textBlock(text, textFont, size * scale, width);
    lines.push(
      ...block.lines.map((line) => ({ ...line, top: line.top + height })),
    );
    height += block.height + size * 0.4;
  }
  return { lines, height };
}
export async function generateLyricsPdf(
  songs: readonly PrintSong[],
  options: LyricOptions,
  fonts: FontSource,
): Promise<PdfResult> {
  if (
    songs.length !== 4 ||
    new Set(songs.map((s) => s.id)).size !== 4 ||
    songs.some((s) => s.kind !== "lyrics")
  )
    return {
      ok: false,
      issues: [
        {
          code: "selection",
          songIds: [],
          message: "Escolha quatro letras diferentes para gerar o PDF.",
        },
      ],
    };
  return composeLyrics(songs, options, fonts);
}
export async function composeLyrics(
  songs: readonly PrintSong[],
  options: LyricOptions,
  fonts: FontSource,
): Promise<PdfResult> {
  if (
    options.sizing.mode === "manual" &&
    (!Number.isInteger(options.sizing.size) ||
      options.sizing.size < 9 ||
      options.sizing.size > 16)
  )
    return {
      ok: false,
      issues: [
        {
          code: "font-size",
          songIds: [],
          message: "Escolha um tamanho inteiro de 9 a 16 pontos.",
        },
      ],
    };
  let context;
  try {
    context = await createPdfFont(fonts, options.family);
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
  const { doc, font, bold } = context;
  const normalized = songs.map((s) => ({
    ...s,
    title: s.title.normalize("NFC"),
    artist: s.artist.normalize("NFC"),
    content: s.content.normalize("NFC"),
  }));
  const unsupported = [
    ...unsupportedGlyphs(normalized, font),
    ...unsupportedGlyphs(
      normalized.map((s) => ({ ...s, artist: "", content: "" })),
      bold,
    ),
  ];
  if (unsupported.length) return { ok: false, issues: unsupported };
  const width = (PAGE.width - 2 * PAGE.margin - PAGE.gutter) / 2,
    available = PAGE.height - 2 * PAGE.margin;
  const sizes =
    options.sizing.mode === "manual"
      ? [options.sizing.size]
      : [16, 15, 14, 13, 12, 11, 10, 9];
  let issues: PdfIssue[] = [];
  for (const size of sizes) {
    const columns = [normalized.slice(0, 2), normalized.slice(2, 4)].map(
      (group) => group.map((song) => songBlock(song, font, bold, size, width)),
    );
    issues = [];
    columns.forEach((blocks, column) => {
      if (
        blocks.reduce((h, b) => h + b.height, 0) +
          Math.max(0, blocks.length - 1) * mm(6) >
        available
      )
        issues.push({
          code: "overflow",
          column: column as 0 | 1,
          songIds: normalized
            .slice(column * 2, column * 2 + 2)
            .map((s) => s.id),
          message:
            "As músicas da coluna " +
            (column === 0 ? "esquerda" : "direita") +
            " não cabem. Reduza a fonte, use o ajuste automático ou revise a seleção.",
        });
    });
    if (issues.length) continue;
    const page = doc.addPage([PAGE.width, PAGE.height]);
    columns.forEach((blocks, col) => {
      let top = PAGE.height - PAGE.margin;
      for (const block of blocks) {
        drawLines(
          page,
          font,
          block.lines,
          PAGE.margin + col * (width + PAGE.gutter),
          top,
        );
        top -= block.height + mm(6);
      }
    });
    return { ok: true, bytes: await doc.save(), pageCount: 1, fontSize: size };
  }
  return { ok: false, issues };
}
