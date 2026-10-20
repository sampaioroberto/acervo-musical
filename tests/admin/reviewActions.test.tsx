import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { File as NodeFile } from "node:buffer";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminWorkspace } from "../../src/admin/AdminWorkspace";
import { memoryRepo } from "./memoryRepo";

vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));
beforeEach(() => vi.stubGlobal("File", NodeFile));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("removes one imported song and publishes only the remaining reviewed songs", async () => {
  const { repo, records, files } = memoryRepo();
  const removeSong = vi.spyOn(repo, "deleteSong");
  const removeOriginal = vi.spyOn(repo, "removeOriginal");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  for (let n = 1; n <= 4; n++)
    pdf.addPage().drawText(`Musica ${n}\nC   G\nVerso ${n}`, {
      font,
      x: 40,
      y: 740,
      size: 12,
      lineHeight: 18,
    });
  render(<AdminWorkspace repo={repo} onSignOut={() => {}} signOutError="" />);
  fireEvent.change(screen.getByLabelText("Tipo", { exact: true }), {
    target: { value: "chords" },
  });
  fireEvent.change(screen.getByLabelText("Enviar arquivos"), {
    target: {
      files: [
        new File([new Uint8Array(await pdf.save())], "Visita.pdf", {
          type: "application/pdf",
        }),
      ],
    },
  });
  await waitFor(() =>
    expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(4),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Digitar" })).toBeEnabled(),
  );
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(
    screen.getByRole("button", { name: "Remover Musica 2 da revisão" }),
  );
  expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(4);
  confirm.mockReturnValue(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Remover Musica 2 da revisão" }),
  );
  expect(
    screen
      .getAllByRole("textbox", { name: "Título" })
      .map((el) => (el as HTMLInputElement).value),
  ).toEqual(["Musica 1", "Musica 3", "Musica 4"]);
  fireEvent.click(
    screen.getByRole("button", { name: "Marcar todos como revisados" }),
  );
  screen
    .getAllByRole("checkbox", { name: /Conferi o texto/ })
    .forEach((el) => expect(el).toBeChecked());
  expect(records.size).toBe(0);
  expect(
    screen.getByRole("button", { name: "Marcar todos como revisados" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Publicar revisados" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("textbox", { name: "Título" }),
    ).not.toBeInTheDocument(),
  );
  expect([...records.values()].map((song) => song.title)).toEqual([
    "Musica 1",
    "Musica 3",
    "Musica 4",
  ]);
  expect(files.size).toBe(3);
  expect(removeSong).not.toHaveBeenCalled();
  expect(removeOriginal).not.toHaveBeenCalled();
});

it("marks only complete drafts, resets review on edits and lets the last item be removed", () => {
  const { repo, records } = memoryRepo();
  render(<AdminWorkspace repo={repo} onSignOut={() => {}} signOutError="" />);
  fireEvent.click(screen.getByRole("button", { name: "Digitar" }));
  fireEvent.click(screen.getByRole("button", { name: "Digitar" }));
  const titles = screen.getAllByRole("textbox", { name: "Título" });
  expect(screen.queryAllByRole("textbox", { name: /Artista/ })).toHaveLength(0);
  const contents = screen.getAllByRole("textbox", { name: "Letra" });
  fireEvent.change(titles[0], { target: { value: "Completa" } });
  fireEvent.change(contents[0], { target: { value: "Verso" } });
  fireEvent.change(titles[1], { target: { value: "Incompleta" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Marcar todos como revisados" }),
  );
  const checks = screen.getAllByRole("checkbox", { name: /Conferi o texto/ });
  expect(checks[0]).toBeChecked();
  expect(checks[1]).not.toBeChecked();
  expect(checks[1]).toBeDisabled();
  fireEvent.change(contents[0], { target: { value: "Verso alterado" } });
  expect(checks[0]).not.toBeChecked();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Remover Incompleta da revisão" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Remover Completa da revisão" }),
  );
  expect(screen.queryByText(/Músicas para salvar/)).not.toBeInTheDocument();
  expect(records.size).toBe(0);
});
