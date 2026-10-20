import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { File as NodeFile } from "node:buffer";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { AdminWorkspace } from "../../src/admin/AdminWorkspace";
import { memoryRepo } from "./memoryRepo";
vi.mock("../../src/pdf/pdfjs", () => import("pdfjs-dist/legacy/build/pdf.mjs"));
beforeEach(() => vi.stubGlobal("File", NodeFile));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("reviews a multipage PDF, confirms regrouping edits, and publishes only reviewed songs", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  for (const text of [
    "Caminho\nC   G\nPrimeiro verso",
    "Caminho (continuacao)\nAm  F\nSegundo verso",
    "Outra cancao\nD   A\nOutra voz",
  ]) {
    pdf
      .addPage()
      .drawText(text, { font, x: 40, y: 780, size: 12, lineHeight: 18 });
  }
  const file = new File([new Uint8Array(await pdf.save())], "Visita.pdf", {
    type: "application/pdf",
  });
  const { repo, records, files } = memoryRepo();
  render(<AdminWorkspace repo={repo} onSignOut={() => {}} signOutError="" />);
  fireEvent.change(screen.getByLabelText("Tipo", { exact: true }), {
    target: { value: "chords" },
  });
  fireEvent.change(screen.getByLabelText("Enviar arquivos"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(3),
  );
  expect(
    screen.getByText(/A próxima página pode ser continuação/),
  ).toBeInTheDocument();
  expect(
    screen
      .getAllByRole("textbox", { name: "Título" })
      .map((el) => (el as HTMLInputElement).value),
  ).toEqual(["Caminho", "Caminho (continuacao)", "Outra cancao"]);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Juntar com a próxima página" })[0],
  );
  await waitFor(() =>
    expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(2),
  );
  const content = screen.getAllByRole("textbox", { name: "Conteúdo" })[0];
  expect(content).toHaveValue("C   G\nPrimeiro verso\n\nAm  F\nSegundo verso");
  fireEvent.change(content, { target: { value: "C   G\nAjuste manual" } });
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Separar páginas" }));
  expect(confirm).toHaveBeenCalled();
  expect(content).toHaveValue("C   G\nAjuste manual");
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Separar páginas" }));
  await waitFor(() =>
    expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(3),
  );
  fireEvent.click(
    screen.getAllByRole("button", { name: "Juntar com a próxima página" })[0],
  );
  await waitFor(() =>
    expect(screen.getAllByRole("textbox", { name: "Título" })).toHaveLength(2),
  );
  fireEvent.click(
    screen.getAllByRole("checkbox", { name: /Conferi o texto/ })[0],
  );
  fireEvent.click(screen.getByRole("button", { name: "Publicar revisados" }));
  await waitFor(() => expect(records.size).toBe(1));
  expect([...records.values()][0]).toMatchObject({
    title: "Caminho",
    kind: "chords",
    status: "published",
  });
  expect(files.size).toBe(1);
  expect(screen.getByRole("textbox", { name: "Título" })).toHaveValue(
    "Outra cancao",
  );
});
