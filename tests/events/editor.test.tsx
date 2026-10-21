import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { EventEditor } from "../../src/events/EventEditor";
import { memoryRepo } from "../admin/memoryRepo";
import { memoryEvents } from "./memoryEvents";
it("organizes both types in chosen order and retries a failed event save with the same ID", async () => {
  const songs = memoryRepo();
  for (const [id, title, kind] of [
    ["a", "Primeira", "lyrics"],
    ["b", "Segunda", "lyrics"],
    ["c", "Primeira", "chords"],
  ] as const)
    songs.records.set(id, {
      id,
      title,
      kind,
      content: "Texto " + id,
      artist: "",
      status: "published",
      createdAt: "",
      updatedAt: "",
      original: null,
    });
  const events = memoryEvents(() => [...songs.records.values()]);
  const save = vi.spyOn(events.repo, "save");
  const onSaved = vi.fn();
  render(
    <EventEditor
      songsRepo={songs.repo}
      eventsRepo={events.repo}
      initial={null}
      onSaved={onSaved}
      onCancel={() => {}}
    />,
  );
  expect(
    screen.queryByRole("textbox", { name: "Nome do evento" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Data"), {
    target: { value: "2026-05-16" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Adicionar letra de Primeira" }),
  );
  expect(
    screen.getByRole("button", { name: "Retirar cifra Primeira" }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Retirar cifra Primeira" }),
  );
  expect(
    screen.getByRole("button", { name: "Retirar letra Primeira" }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar letra de Segunda" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Subir letra Segunda" }));
  fireEvent.change(screen.getByLabelText("Tipo de música"), {
    target: { value: "chords" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar cifra de Primeira" }),
  );
  events.state.fail = true;
  fireEvent.click(screen.getByRole("button", { name: "Publicar evento" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha de teste");
  expect(screen.getByLabelText("Data")).toHaveValue("2026-05-16");
  events.state.fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Publicar evento" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  expect(events.records.size).toBe(1);
  expect([...events.records.values()][0].title).toBe("Cora");
  const saved = [...events.records.values()][0];
  expect(
    saved.songs.filter((s) => s.kind === "lyrics").map((s) => s.id),
  ).toEqual(["b", "a"]);
  expect(
    saved.songs.filter((s) => s.kind === "chords").map((s) => s.id),
  ).toEqual(["c"]);
  expect(save.mock.calls[0][0].id).toBe(save.mock.calls[1][0].id);
});
it("pairs a chord with its published lyric using the full normalized title without duplicating an existing selection", async () => {
  const songs = memoryRepo();
  for (const [id, title, kind, status] of [
    ["lyric", "Canção de Paz", "lyrics", "published"],
    ["chord", "  CANCAO   DE PAZ ", "chords", "published"],
    ["draft", "Canção de Paz", "lyrics", "draft"],
    ["different", "Canção de Paz (Outra)", "lyrics", "published"],
  ] as const)
    songs.records.set(id, {
      id,
      title,
      kind,
      status,
      artist: "",
      content: "Verso",
      createdAt: "",
      updatedAt: "",
      original: null,
    });
  const events = memoryEvents(() => [...songs.records.values()]);
  render(
    <EventEditor
      songsRepo={songs.repo}
      eventsRepo={events.repo}
      initial={null}
      onSaved={() => {}}
      onCancel={() => {}}
    />,
  );
  await screen.findByRole("button", {
    name: "Adicionar letra de Canção de Paz",
  });
  fireEvent.change(screen.getByLabelText("Tipo de música"), {
    target: { value: "chords" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Adicionar cifra de.*CANCAO/ }),
  );
  expect(
    screen.getByRole("button", { name: "Retirar letra Canção de Paz" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", {
      name: "Retirar letra Canção de Paz (Outra)",
    }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Letras (1)" })).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: /Retirar cifra.*CANCAO/ }),
  );
  expect(
    screen.getByRole("button", { name: "Retirar letra Canção de Paz" }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: /Adicionar cifra de.*CANCAO/ }),
  );
  expect(screen.getByRole("heading", { name: "Letras (1)" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Cifras (1)" })).toBeVisible();
});
it("keeps newly published songs available when the initial catalog response arrives late", async () => {
  const songs = memoryRepo();
  let finish!: (rows: []) => void;
  songs.repo.listAdmin = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const events = memoryEvents(() => [...songs.records.values()]);
  render(
    <EventEditor
      songsRepo={songs.repo}
      eventsRepo={events.repo}
      initial={null}
      onSaved={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar músicas novas" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Digitar música" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Título" }), {
    target: { value: "Recém-publicada" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Letra" }), {
    target: { value: "Verso" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Marcar todos como revisados" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Publicar no acervo e adicionar" }),
  );
  await screen.findByRole("button", { name: "Retirar letra Recém-publicada" });
  await act(async () => finish([]));
  fireEvent.click(
    screen.getByRole("button", { name: "Retirar letra Recém-publicada" }),
  );
  expect(
    screen.getByRole("button", { name: "Adicionar letra de Recém-publicada" }),
  ).toBeVisible();
});
