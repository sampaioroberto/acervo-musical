import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PdfComposer } from "../../src/pdf/PdfComposer";
import { makePrintSongs } from "./fixtures";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("../../src/pdf/lyrics", () => ({ generateLyricsPdf: generate }));
vi.mock("../../src/pdf/PdfPreview", () => ({ PdfPreview: () => null }));
it("starts in auto, preserves manual size when family changes and returns to auto", async () => {
  generate.mockResolvedValue({
    ok: true,
    bytes: new Uint8Array([1]),
    pageCount: 1,
    fontSize: 16,
  });
  render(
    <PdfComposer
      songs={makePrintSongs("lyrics", "Canção")}
      onClose={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeDisabled();
  expect(
    screen.getByRole("combobox", { name: "Fonte das letras" }),
  ).toHaveValue("sans");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeEnabled(),
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Tamanho da fonte" }),
    { target: { value: "12" } },
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Fonte das letras" }), {
    target: { value: "serif" },
  });
  expect(
    screen.getByRole("spinbutton", { name: "Tamanho da fonte" }),
  ).toHaveValue(12);
  expect(screen.getByText("Ajuste manual")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ajuste automático" }));
  expect(screen.getByText("Ajuste automático ativo")).toBeInTheDocument();
});
it("identifies overflow and prevents download", async () => {
  generate.mockResolvedValue({
    ok: false,
    issues: [
      {
        code: "overflow",
        songIds: ["1", "2"],
        column: 0,
        message: "A coluna esquerda não cabe.",
      },
    ],
  });
  render(
    <PdfComposer
      songs={makePrintSongs("lyrics", "Verso")}
      onClose={() => {}}
    />,
  );
  expect(
    await screen.findByText("A coluna esquerda não cabe."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeDisabled();
});
