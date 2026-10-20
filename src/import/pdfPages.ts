import { PDFDocument } from "pdf-lib";
import type { SongDraft, SongKind } from "../catalog/types";
import { extractPdf } from "./pdf";
import { MAX_FILE_SIZE, validateFiles } from "./validate";
import { DocumentImportError } from "./types";

export type PdfImportPage = {
  number: number;
  file: File;
  draft: SongDraft;
  heading: boolean;
  continuation: boolean;
  warnings: string[];
};
const plain = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export function pdfTitleKey(title: string): string {
  return plain(title)
    .replace(/\s*[-–—,:]?\s*\(?continua(?:cao|tion)?\)?\s*$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
const hasContinuation = (text: string) =>
  /\bcontinua(?:cao|tion)?\b/u.test(plain(text));
function hasHeading(line: string): boolean {
  if (
    !line ||
    line.length > 180 ||
    /^(?:tom|intro|capo|capotraste|ritmo|compasso)\s*:/iu.test(line)
  )
    return false;
  const chord =
    /^[A-G](?:#|b)?(?:(?:m|M|maj|min|dim|aug|sus|add|º|°)|[\d#b()+-])*(?:\/[A-G](?:#|b)?)?$/u;
  return !line
    .split(/\s+/u)
    .every((token) => chord.test(token) || /^[|:/()[\]\d.-]+$/u.test(token));
}
function partName(name: string, numbers: number[]) {
  const base = name.replace(/\.pdf$/iu, "").slice(0, 160);
  return (
    base +
    (numbers.length === 1
      ? " - página " + numbers[0]
      : " - páginas " + numbers[0] + "-" + numbers[numbers.length - 1]) +
    ".pdf"
  );
}
function checkedFile(bytes: Uint8Array, name: string): File {
  const file = new File([new Uint8Array(bytes)], name, {
    type: "application/pdf",
  });
  if (file.size > MAX_FILE_SIZE)
    throw new DocumentImportError(
      "size",
      "As páginas separadas ultrapassam 10 MiB. Envie um PDF menor.",
    );
  return file;
}
export async function importPdfPages(
  file: File,
  kind: SongKind,
): Promise<PdfImportPage[]> {
  const validation = validateFiles([file]);
  if (validation.rejected.length)
    throw new DocumentImportError("invalid", validation.rejected[0].message);
  const data = await file.arrayBuffer();
  const extracted = await extractPdf(data);
  if (!extracted.pages.length)
    throw new DocumentImportError(
      "empty",
      "Este PDF não contém páginas para importar.",
    );
  const source = await PDFDocument.load(new Uint8Array(data));
  const pages: PdfImportPage[] = [];
  for (const page of extracted.pages) {
    const pdf = await PDFDocument.create();
    const [copy] = await pdf.copyPages(source, [page.number - 1]);
    pdf.addPage(copy);
    const lines = page.text.split("\n");
    const first = lines.findIndex((line) => !!line.trim());
    const heading = first >= 0 && hasHeading(lines[first].trim());
    const title = heading
      ? lines[first].trim()
      : file.name.replace(/\.pdf$/iu, "") + " · página " + page.number;
    if (heading) lines.splice(first, 1);
    const content = lines
      .join("\n")
      .replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/gu, "");
    pages.push({
      number: page.number,
      file: checkedFile(await pdf.save(), partName(file.name, [page.number])),
      draft: { title, artist: "", kind, content },
      heading,
      continuation: hasContinuation(title),
      warnings: [
        ...page.warnings,
        ...(!content.trim()
          ? [
              "Não encontrei texto nesta página. Confira o PDF e preencha o conteúdo antes de salvar.",
            ]
          : []),
      ],
    });
  }
  return pages;
}
export async function joinPdfPages(
  pages: readonly PdfImportPage[],
  sourceName: string,
): Promise<File> {
  const pdf = await PDFDocument.create();
  for (const page of pages) {
    const source = await PDFDocument.load(
      new Uint8Array(await page.file.arrayBuffer()),
    );
    const [copy] = await pdf.copyPages(source, [0]);
    pdf.addPage(copy);
  }
  return checkedFile(
    await pdf.save(),
    partName(
      sourceName,
      pages.map((p) => p.number),
    ),
  );
}
