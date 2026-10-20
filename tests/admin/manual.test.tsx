import { it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminWorkspace } from "../../src/admin/AdminWorkspace";
import { memoryRepo } from "./memoryRepo";

it("publishes a manually typed lyric without a file and preserves verse breaks", async () => {
  const { repo, records, files } = memoryRepo();
  render(<AdminWorkspace repo={repo} onSignOut={() => {}} signOutError="" />);
  fireEvent.click(screen.getByRole("button", { name: "Digitar" }));
  const publish = screen.getByRole("button", { name: "Publicar" });
  expect(publish).toBeDisabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Título" }),
    {
      target: { value: "  Canção manual  " },
    },
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Letra" }),
    {
      target: { value: "Voz e coração\n\nUma nova manhã" },
    },
  );
  expect(publish).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /Conferi o texto/ }));
  fireEvent.click(publish);
  expect(await screen.findByText("Publicado no acervo")).toBeInTheDocument();
  expect(records.size).toBe(1);
  expect([...records.values()][0]).toMatchObject({
    title: "Canção manual",
    content: "Voz e coração\n\nUma nova manhã",
    kind: "lyrics",
    status: "published",
    original: null,
  });
  expect(files.size).toBe(0);
});

it("keeps a manual chord draft after a save failure and retries without duplication", async () => {
  const { repo, records, files, state } = memoryRepo();
  state.saveFailure = "before";
  render(<AdminWorkspace repo={repo} onSignOut={() => {}} signOutError="" />);
  fireEvent.change(screen.getByLabelText("Tipo", { exact: true }), {
    target: { value: "chords" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Digitar" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Título" }),
    {
      target: { value: "Cifra manual" },
    },
  );
  const content = screen.getByRole("textbox", { name: "Cifra" });
  fireEvent.change(content, { target: { value: "C   G\nVoz e coração" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar rascunho" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar",
  );
  expect(content).toHaveValue("C   G\nVoz e coração");
  expect(records.size).toBe(0);
  state.saveFailure = "none";
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar rascunho" }),
  );
  await waitFor(() => expect(records.size).toBe(1));
  expect([...records.values()][0]).toMatchObject({
    title: "Cifra manual",
    kind: "chords",
    content: "C   G\nVoz e coração",
    status: "draft",
    original: null,
  });
  expect(files.size).toBe(0);
  expect(await repo.listPublished({ kind: "chords", search: "" })).toEqual([]);
});
