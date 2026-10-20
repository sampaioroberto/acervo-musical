import type { PDFFont, PDFPage } from "pdf-lib";
export const mm = (value: number) => (value * 72) / 25.4;
export const PAGE = {
  width: mm(210),
  height: mm(297),
  margin: mm(12),
  gutter: mm(8),
};
export type TextLine = { text: string; size: number; top: number };
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const output: string[] = [];
  for (const paragraph of text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .split("\n")) {
    if (!paragraph.trim()) {
      output.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        output.push(line);
        line = "";
      }
      for (const char of word) {
        if (font.widthOfTextAtSize(line + char, size) > width && line) {
          output.push(line);
          line = "";
        }
        line += char;
      }
    }
    output.push(line);
  }
  return output;
}
export function textBlock(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
  wrap = true,
): { lines: TextLine[]; height: number } {
  const strings = wrap ? wrapText(text, font, size, width) : text.split("\n");
  return {
    lines: strings.map((text, i) => ({ text, size, top: i * size * 1.2 })),
    height: (strings.length - 1) * size * 1.2 + font.heightAtSize(size),
  };
}
export function drawLines(
  page: PDFPage,
  font: PDFFont,
  lines: TextLine[],
  x: number,
  top: number,
) {
  for (const line of lines)
    if (line.text)
      page.drawText(line.text, {
        x,
        y: top - line.top - font.heightAtSize(line.size, { descender: false }),
        font,
        size: line.size,
      });
}
