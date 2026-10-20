import type { PrintSong } from "../pdf/types";
import type { SongStatus } from "../catalog/types";
export type EventSong = PrintSong;
export type EventSummary = {
  id: string;
  title: string;
  date: string;
  status: SongStatus;
  createdAt: string;
  updatedAt: string;
};
export type ArchiveEvent = EventSummary & { songs: EventSong[] };
export type EventInput = {
  id: string;
  title: string;
  date: string;
  status: SongStatus;
  songIds: string[];
};
export interface PublicEventRepository {
  listPublished(): Promise<EventSummary[]>;
  latestPublished(): Promise<EventSummary | null>;
  getPublished(id: string): Promise<ArchiveEvent | null>;
}
export interface EventRepository extends PublicEventRepository {
  listAdmin(): Promise<EventSummary[]>;
  getAdmin(id: string): Promise<ArchiveEvent | null>;
  save(input: EventInput): Promise<ArchiveEvent>;
  remove(id: string): Promise<void>;
}
