import { it, expect } from "vitest";
import { moveEventSong } from "../../src/events/model";
import type { EventSong } from "../../src/events/types";
const song = (
  id: string,
  title: string,
  kind: EventSong["kind"],
): EventSong => ({
  id,
  title,
  kind,
  artist: "",
  content: "Texto original " + id,
});
const ids = (songs: EventSong[], kind: EventSong["kind"]) =>
  songs.filter((s) => s.kind === kind).map((s) => s.id);
it.each(["lyrics", "chords"] as const)(
  "keeps repeated title versions aligned when moving %s across another title",
  (kind) => {
    const input = [
      song("la1", "A", "lyrics"),
      song("la2", "A", "lyrics"),
      song("lb", "B", "lyrics"),
      song("ca1", "A", "chords"),
      song("ca2", "A", "chords"),
      song("cb", "B", "chords"),
    ];
    const moved = moveEventSong(input, kind === "lyrics" ? "la2" : "ca2", 1);
    expect(ids(moved, "lyrics")).toEqual(["la1", "lb", "la2"]);
    expect(ids(moved, "chords")).toEqual(["ca1", "cb", "ca2"]);
  },
);
it.each(["lyrics", "chords"] as const)(
  "keeps both versions in the chosen order when moving %s up and down",
  (kind) => {
    const input = [
      song("la", "Canção A", "lyrics"),
      song("ca", " CANCAO   A ", "chords"),
      song("lb", "B", "lyrics"),
      song("cb", "B", "chords"),
    ];
    const moved = moveEventSong(input, kind === "lyrics" ? "lb" : "cb", -1);
    expect(ids(moved, "lyrics")).toEqual(["lb", "la"]);
    expect(ids(moved, "chords")).toEqual(["cb", "ca"]);
    expect(input.map((s) => s.id)).toEqual(["la", "ca", "lb", "cb"]);
    expect(moved.every((s) => input.includes(s))).toBe(true);
    const restored = moveEventSong(moved, kind === "lyrics" ? "lb" : "cb", 1);
    expect(ids(restored, "lyrics")).toEqual(["la", "lb"]);
    expect(ids(restored, "chords")).toEqual(["ca", "cb"]);
  },
);
it("preserves songs without another version and keeps a removed counterpart absent", () => {
  const input = [
    song("la", "A", "lyrics"),
    song("lx", "Só letra", "lyrics"),
    song("lb", "B", "lyrics"),
    song("ca", "A", "chords"),
    song("cy", "Só cifra", "chords"),
    song("cb", "B", "chords"),
  ];
  const moved = moveEventSong(moveEventSong(input, "lb", -1), "lb", -1);
  expect(ids(moved, "lyrics")).toEqual(["lb", "la", "lx"]);
  expect(ids(moved, "chords")).toEqual(["cb", "cy", "ca"]);
  const missing = input.filter((s) => s.id !== "cb");
  expect(
    ids(moveEventSong(moveEventSong(missing, "lb", -1), "lb", -1), "chords"),
  ).toEqual(["ca", "cy"]);
  expect(moveEventSong(input, "la", -1)).toBe(input);
  expect(moveEventSong(input, "missing", 1)).toBe(input);
});
