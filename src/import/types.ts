import type { SongDraft } from "../catalog/types";
export type ImportCode =
  "invalid" | "size" | "encrypted" | "empty" | "unsupported";
export type ImportResult =
  | { ok: true; draft: SongDraft; warnings: string[] }
  | { ok: false; code: ImportCode; message: string };
export class DocumentImportError extends Error {
  constructor(
    public code: ImportCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentImportError";
  }
}
