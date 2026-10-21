import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  EventDetail,
  EventsPage,
  LatestEvent,
} from "../../src/events/EventPages";
import { memoryEvents } from "./memoryEvents";
const snapshot = {
  id: "song",
  title: "Canção do dia",
  artist: "",
  kind: "lyrics" as const,
  content: "Texto histórico",
};
function setup() {
  const events = memoryEvents();
  for (const [id, date, status] of [
    ["old", "2026-05-16", "published"],
    ["new", "2026-06-01", "published"],
    ["secret", "2027-01-01", "draft"],
  ] as const)
    events.records.set(id, {
      id,
      title: "Cora " + id,
      date,
      status,
      songs: [
        snapshot,
        {
          ...snapshot,
          id: "chord",
          kind: "chords",
          content: "C   G\nTexto com cifra",
        },
      ],
      createdAt: "2026-01-01",
      updatedAt: "",
    });
  return events;
}
it("highlights the latest published date and lists only public events", async () => {
  const events = setup();
  const view = render(<LatestEvent repository={events.repo} />);
  expect(await screen.findByRole("link", { name: /Cora new/ })).toHaveAttribute(
    "href",
    "#/events/new",
  );
  view.unmount();
  render(<EventsPage repository={events.repo} />);
  expect(
    await screen.findByRole("link", { name: /Cora old/ }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Cora secret")).not.toBeInTheDocument();
});
it("exposes individual snapshots and composes complete PDFs separately by kind", async () => {
  const events = setup(),
    compose = vi.fn();
  render(<EventDetail repository={events.repo} id="new" onCompose={compose} />);
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Visualizar letra de Canção do dia",
    }),
  );
  expect(screen.getByText("Texto histórico")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "PDF das letras" }));
  expect(compose.mock.calls[0][0].map((s: { id: string }) => s.id)).toEqual([
    "song",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "PDF das cifras" }));
  expect(compose.mock.calls[1][0].map((s: { id: string }) => s.id)).toEqual([
    "chord",
  ]);
});
it("shows an unavailable message for private or removed events", async () => {
  render(
    <EventDetail repository={setup().repo} id="secret" onCompose={() => {}} />,
  );
  expect(await screen.findByText("Evento não encontrado.")).toBeInTheDocument();
});
