import { DocumentImportError } from "./types";
import { normalizeText } from "./normalize";
type Part = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
function rebuild(parts: Part[]): { text: string; complex: boolean } {
  if (!parts.length) return { text: "", complex: false };
  const rows: { y: number; items: Part[] }[] = [];
  for (const part of parts.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(
      (r) => Math.abs(r.y - part.y) <= Math.max(1.5, part.height * 0.2),
    );
    if (row) row.items.push(part);
    else rows.push({ y: part.y, items: [part] });
  }
  rows.sort((a, b) => a.y - b.y);
  const differences = rows
    .slice(1)
    .map((r, i) => r.y - rows[i].y)
    .filter((d) => d > 3);
  const normalGap = differences.length ? Math.min(...differences) : 16,
    left = Math.min(...parts.map((p) => p.x));
  let previousY: number | undefined,
    complex = false;
  const lines: string[] = [];
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
    const first = row.items[0];
    const unit =
      first.width / Math.max(1, [...first.text].length) ||
      first.height * 0.5 ||
      5;
    if (previousY !== undefined && row.y - previousY > normalGap * 1.6)
      lines.push("");
    let line = " ".repeat(Math.max(0, Math.round((first.x - left) / unit))),
      end = first.x;
    for (const part of row.items) {
      const gap = part.x - end;
      if (gap > unit * 0.35) {
        const spaces = Math.max(1, Math.round(gap / unit));
        if (spaces > 12) complex = true;
        line += " ".repeat(spaces);
      }
      line += part.text;
      end = Math.max(end, part.x + part.width);
    }
    lines.push(line.trimEnd());
    previousY = row.y;
  }
  return { text: normalizeText(lines.join("\n")), complex };
}
export async function extractPdf(
  data: ArrayBuffer,
): Promise<{
  text: string;
  warnings: string[];
  pages: { number: number; text: string; warnings: string[] }[];
}> {
  const { getDocument } = await import("../pdf/pdfjs");
  const task = getDocument({ data: new Uint8Array(data.slice(0)) });
  const texts: string[] = [];
  const pages: { number: number; text: string; warnings: string[] }[] = [];
  let complex = false;
  try {
    const doc = await task.promise;
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n),
        viewport = page.getViewport({ scale: 1 }),
        m = viewport.transform;
      const content = await page.getTextContent();
      const parts: Part[] = content.items
        .filter((item) => "str" in item && item.str.trim() !== "")
        .map((item) => {
          if (!("str" in item)) throw Error("Invalid text item");
          const x = item.transform[4],
            y = item.transform[5];
          return {
            text: item.str,
            x: m[0] * x + m[2] * y + m[4],
            y: m[1] * x + m[3] * y + m[5],
            width: item.width,
            height: item.height || Math.abs(item.transform[3]),
          };
        });
      const rebuilt = rebuild(parts);
      texts.push(rebuilt.text);
      pages.push({
        number: n,
        text: rebuilt.text,
        warnings:
          rebuilt.complex || viewport.rotation !== 0
            ? [
                "Confira a ordem dos versos e o alinhamento dos acordes desta página.",
              ]
            : [],
      });
      complex = complex || rebuilt.complex || viewport.rotation !== 0;
    }
    return {
      pages,
      text: texts.join("\n\n").replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, ""),
      warnings: complex
        ? [
            "Este PDF tem um layout que precisa de revisão. Confira a ordem dos versos e o alinhamento dos acordes.",
          ]
        : [],
    };
  } catch (error) {
    if ((error as Error)?.name === "PasswordException")
      throw new DocumentImportError(
        "encrypted",
        "Este PDF pede uma senha. Envie uma cópia sem proteção ou cole o texto na revisão.",
      );
    throw new DocumentImportError(
      "invalid",
      "Não foi possível ler este PDF. Verifique o arquivo e tente novamente.",
    );
  } finally {
    await task.destroy().catch(() => {});
  }
}
