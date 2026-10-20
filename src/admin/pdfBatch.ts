import type { SongDraft } from "../catalog/types";
import {
  joinPdfPages,
  pdfTitleKey,
  type PdfImportPage,
} from "../import/pdfPages";
import { createImportItem, type ImportItem } from "./batch";

const sameDraft = (a: SongDraft, b: SongDraft) =>
  a.title === b.title &&
  a.artist === b.artist &&
  a.kind === b.kind &&
  a.content === b.content;
const mutable = (item: ImportItem) =>
  !!item.pdf &&
  !item.saveAttempted &&
  !["importing", "saving", "saved"].includes(item.status);
export function createPdfItems(
  sourceName: string,
  pages: PdfImportPage[],
  sourceId: string = crypto.randomUUID(),
): ImportItem[] {
  return pages.map((page) => ({
    ...createImportItem(page.file, page.draft.kind),
    draft: { ...page.draft },
    status: "review",
    warnings: [...page.warnings],
    pdf: { sourceId, sourceName, pages: [page], baseline: { ...page.draft } },
  }));
}
export function canJoinNext(a: ImportItem, b?: ImportItem): boolean {
  return (
    !!b &&
    mutable(a) &&
    mutable(b) &&
    a.pdf!.sourceId === b.pdf!.sourceId &&
    a.draft.kind === b.draft.kind &&
    a.pdf!.pages[a.pdf!.pages.length - 1].number + 1 === b.pdf!.pages[0].number
  );
}
export function suggestsContinuation(a: ImportItem, b?: ImportItem): boolean {
  if (!b || !canJoinNext(a, b)) return false;
  const key = pdfTitleKey(a.draft.title);
  return (
    b.pdf!.pages[0].continuation ||
    (!!key && key === pdfTitleKey(b.draft.title))
  );
}
export function splitNeedsConfirmation(item: ImportItem): boolean {
  return (
    !!item.pdf &&
    (!!item.pdf.editedBeforeMerge || !sameDraft(item.draft, item.pdf.baseline))
  );
}
export async function joinPdfItems(
  a: ImportItem,
  b: ImportItem,
): Promise<ImportItem> {
  if (!canJoinNext(a, b))
    throw new Error("Essas páginas não podem ser unidas.");
  const left = a.pdf!,
    right = b.pdf!;
  const pages = [...left.pages, ...right.pages];
  const sameTitle = pdfTitleKey(a.draft.title) === pdfTitleKey(b.draft.title);
  const unchangedContinuation =
    right.pages[0].continuation && b.draft.title === right.baseline.title;
  const includeTitle =
    (right.pages[0].heading || b.draft.title !== right.baseline.title) &&
    !sameTitle &&
    !unchangedContinuation;
  const following = [
    includeTitle ? b.draft.title : "",
    b.draft.artist !== a.draft.artist ? b.draft.artist : "",
    b.draft.content,
  ]
    .filter(Boolean)
    .join("\n");
  const draft = {
    ...a.draft,
    content: [a.draft.content, following].filter(Boolean).join("\n\n"),
  };
  const file = await joinPdfPages(pages, left.sourceName);
  return {
    ...createImportItem(file, a.draft.kind),
    draft,
    status: "review",
    warnings: [...new Set([...a.warnings, ...b.warnings])],
    pdf: {
      sourceId: left.sourceId,
      sourceName: left.sourceName,
      pages,
      baseline: { ...draft },
      editedBeforeMerge: splitNeedsConfirmation(a) || splitNeedsConfirmation(b),
    },
  };
}
export function splitPdfItem(
  item: ImportItem,
  discardEdits = false,
): ImportItem[] {
  if (!mutable(item) || item.pdf!.pages.length < 2)
    throw new Error("Separe as páginas antes de salvar.");
  if (splitNeedsConfirmation(item) && !discardEdits)
    throw new Error("Confirme antes de descartar os ajustes.");
  return createPdfItems(
    item.pdf!.sourceName,
    item.pdf!.pages,
    item.pdf!.sourceId,
  );
}
