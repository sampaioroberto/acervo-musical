import type { SongKind } from "../catalog/types";
import { DocumentImportError } from "../import/types";
import { fileKind } from "../import/validate";
import { importFile } from "../import/importFile";
import { createImportItem, type ImportItem } from "./batch";
import { importPdfPages } from "../import/pdfPages";
import { createPdfItems } from "./pdfBatch";

export async function prepareImport(
  file: File,
  kind: SongKind,
): Promise<ImportItem[]> {
  const item = createImportItem(file, kind);
  try {
    if (kind === "chords" && fileKind(file) === "pdf") {
      return createPdfItems(file.name, await importPdfPages(file, kind));
    }
    const result = await importFile(file, kind);
    return result.ok
      ? [
          {
            ...item,
            draft: result.draft,
            warnings: result.warnings,
            status: "review",
          },
        ]
      : [
          {
            ...item,
            status: "error",
            error: result.message,
            attachOriginal: false,
          },
        ];
  } catch (error) {
    return [
      {
        ...item,
        status: "error",
        attachOriginal: false,
        error:
          error instanceof DocumentImportError
            ? error.message
            : "Não foi possível separar este PDF. Tente novamente ou preencha o conteúdo na revisão.",
      },
    ];
  }
}
