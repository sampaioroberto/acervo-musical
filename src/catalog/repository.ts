import type { Song, CatalogQuery, AdminSong, OriginalRef } from "./types";
export interface CatalogRepository {
  listPublished(query: CatalogQuery): Promise<Song[]>;
}
export interface AdminRepository extends CatalogRepository {
  listAdmin(): Promise<AdminSong[]>;
  getAdmin(id: string): Promise<AdminSong | null>;
  save(song: Song, original: OriginalRef | null): Promise<AdminSong>;
  deleteSong(id: string): Promise<OriginalRef | null>;
  uploadOriginal(ref: OriginalRef, file: File): Promise<void>;
  removeOriginal(ref: OriginalRef): Promise<void>;
  listPendingCleanup(): Promise<OriginalRef[]>;
}
