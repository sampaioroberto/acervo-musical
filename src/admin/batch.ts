import type {
  SongDraft,
  SongKind,
  SongStatus,
  OriginalRef,
} from "../catalog/types";
import { searchable } from "../catalog/search";
import { fileKind, DOCX_MIME } from "../import/validate";
import type { PdfImportPage } from "../import/pdfPages";
export type ImportItem = {
  id: string;
  file: File | null;
  original: OriginalRef | null;
  draft: SongDraft;
  reviewed: boolean;
  status: "importing" | "review" | "saving" | "saved" | "error";
  error: string | null;
  warnings: string[];
  attachOriginal?: boolean;
  savedAs?: SongStatus;
  saveAttempted?: boolean;
  pdf?: {
    sourceId: string;
    sourceName: string;
    pages: PdfImportPage[];
    baseline: SongDraft;
    editedBeforeMerge?: boolean;
  };
};
export function createImportItem(
  file: File,
  kind: SongKind,
): ImportItem & { file: File; original: OriginalRef } {
  const id = crypto.randomUUID(),
    ext = fileKind(file) ?? "pdf";
  return {
    id,
    file,
    original: {
      id,
      path: id + "/original." + ext,
      name: file.name,
      mime: ext === "pdf" ? "application/pdf" : DOCX_MIME,
      size: file.size,
    },
    draft: {
      title: file.name.replace(/\.[^.]+$/, "").trim(),
      artist: "",
      kind,
      content: "",
    },
    reviewed: false,
    status: "importing",
    error: null,
    warnings: [],
    attachOriginal: true,
  };
}
export function createManualItem(kind: SongKind): ImportItem {
  return {
    id: crypto.randomUUID(),
    file: null,
    original: null,
    draft: { title: "", artist: "", kind, content: "" },
    reviewed: false,
    status: "review",
    error: null,
    warnings: [],
    attachOriginal: false,
  };
}
export function duplicateIds(
  records: readonly (SongDraft & { id?: string })[],
  items: readonly ImportItem[],
): Set<string> {
  const key = (s: SongDraft) =>
    JSON.stringify([searchable(s.title), searchable(s.artist), s.kind]);
  return new Set(
    items
      .filter((item) => item.draft.title.trim())
      .filter(
        (item) =>
          records.some((s) => s.id !== item.id && key(s) === key(item.draft)) ||
          items.some(
            (other) =>
              other.id !== item.id && key(other.draft) === key(item.draft),
          ),
      )
      .map((item) => item.id),
  );
}
