import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { File as NodeFile } from "node:buffer";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { EventImporter } from "../../src/events/EventImporter";
import { memoryRepo } from "../admin/memoryRepo";
vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));
beforeEach(() => vi.stubGlobal("File", NodeFile));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("publishes imported text into the archive before adding it to the event and preserves a failed import for retry", async () => {
  const { repo, records, state } = memoryRepo();
  const added = vi.fn(),
    pending = vi.fn();
  render(
    <EventImporter
      repo={repo}
      catalog={[]}
      onAdded={added}
      onPendingChange={pending}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Digitar música" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Título" }), {
    target: { value: "Nova música" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Letra" }), {
    target: { value: "Verso" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Marcar todos como revisados" }),
  );
  state.saveFailure = "before";
  fireEvent.click(
    screen.getByRole("button", { name: "Publicar no acervo e adicionar" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar",
  );
  expect(added).not.toHaveBeenCalled();
  state.saveFailure = "none";
  fireEvent.click(
    screen.getByRole("button", { name: "Publicar no acervo e adicionar" }),
  );
  await waitFor(() => expect(added).toHaveBeenCalledOnce());
  expect(records.size).toBe(1);
  expect([...records.values()][0].status).toBe("published");
  await waitFor(() => expect(pending).toHaveBeenLastCalledWith(0));
});
it("reuses a matching published song without creating another archive record", async () => {
  const { repo, records } = memoryRepo();
  const existing = {
    id: "old",
    title: "Existente",
    artist: "",
    content: "Texto salvo",
    kind: "lyrics" as const,
    status: "published" as const,
    createdAt: "",
    updatedAt: "",
    original: null,
  };
  records.set(existing.id, existing);
  const added = vi.fn();
  render(
    <EventImporter
      repo={repo}
      catalog={[existing]}
      onAdded={added}
      onPendingChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Digitar música" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Título" }), {
    target: { value: "Existente" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Usar “Existente” do acervo" }),
  );
  expect(added).toHaveBeenCalledWith(existing);
  expect(records.size).toBe(1);
});
it("splits a combined document into separate editable songs before publishing", async () => {
  const { repo } = memoryRepo();
  render(
    <EventImporter
      repo={repo}
      catalog={[]}
      onAdded={() => {}}
      onPendingChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Digitar música" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Título" }), {
    target: { value: "Arquivo do dia" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Letra" }), {
    target: { value: "Primeiro texto\nSegundo texto" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Dividir em músicas" }));
  const dialog = within(
    screen.getByRole("dialog", { name: "Dividir em músicas" }),
  );
  const titles = dialog.getAllByRole("textbox", { name: "Título" }),
    contents = dialog.getAllByRole("textbox", { name: "Conteúdo" });
  fireEvent.change(titles[0], { target: { value: "Primeira" } });
  fireEvent.change(contents[0], { target: { value: "Primeiro texto" } });
  fireEvent.change(titles[1], { target: { value: "Segunda" } });
  fireEvent.change(contents[1], { target: { value: "Segundo texto" } });
  fireEvent.click(dialog.getByRole("button", { name: "Concluir divisão" }));
  expect(
    screen
      .getAllByRole("textbox", { name: "Título" })
      .map((el) => (el as HTMLInputElement).value),
  ).toEqual(["Primeira", "Segunda"]);
  expect(
    screen
      .getAllByRole("checkbox", { name: /Conferi o texto/ })
      .every((el) => !(el as HTMLInputElement).checked),
  ).toBe(true);
});
