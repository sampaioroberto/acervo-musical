import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CatalogPage } from "../../src/catalog/CatalogPage";
import { createDemoRepository } from "../../src/catalog/demoRepository";
import { readConfig } from "../../src/app/config";
it("lets visitors read lyrics and chords without selecting songs or generating a PDF", async () => {
  render(
    <CatalogPage repository={createDemoRepository()} onCompose={() => {}} />,
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Visualizar letra de Caminho das águas",
    }),
  );
  expect(screen.getByText(/Água clara corre leve/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Ocultar letra de Caminho das águas" }),
  );
  expect(screen.queryByText(/Água clara corre leve/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cifras" }));
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Visualizar cifra de Caminho das águas",
    }),
  );
  expect(screen.getByText(/Água clara corre leve/)).toHaveClass("mono");
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeDisabled();
});
it("searches title and artist without accents and exposes four selections", async () => {
  const repo = createDemoRepository();
  const songs = await repo.listPublished({ kind: "lyrics", search: "cancao" });
  expect(songs).toHaveLength(1);
  expect(songs[0].title).toBe("Canção do amanhecer");
  expect(
    await repo.listPublished({ kind: "lyrics", search: "cora" }),
  ).toHaveLength(4);
  render(<CatalogPage repository={repo} onCompose={() => {}} />);
  const buttons = await screen.findAllByRole("button", { name: /Selecionar / });
  expect(buttons).toHaveLength(4);
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeDisabled();
  buttons.forEach((b) => fireEvent.click(b));
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeEnabled();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "inexistente" },
  });
  expect(
    await screen.findByText("Nenhuma música encontrada."),
  ).toBeInTheDocument();
});
it("generates from one song and keeps all six selections in the chosen order", async () => {
  const [sample] = await createDemoRepository().listPublished({
    kind: "lyrics",
    search: "",
  });
  const songs = Array.from({ length: 6 }, (_, i) => ({
    ...sample,
    id: String(i + 1),
    title: "Música " + (i + 1),
  }));
  const compose = vi.fn();
  render(
    <CatalogPage
      repository={{ listPublished: async () => songs }}
      onCompose={compose}
    />,
  );
  const buttons = await screen.findAllByRole("button", { name: /Selecionar / });
  fireEvent.click(buttons[0]);
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeEnabled();
  buttons.slice(1).forEach((b) => fireEvent.click(b));
  expect(screen.getAllByRole("button", { name: /Retirar / })).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "Subir Música 5" }));
  fireEvent.click(screen.getByRole("button", { name: /Gerar PDF/ }));
  expect(compose.mock.calls[0][0].map((s: { id: string }) => s.id)).toEqual([
    "1",
    "2",
    "3",
    "5",
    "4",
    "6",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Limpar seleção" }));
  expect(screen.getByRole("button", { name: /Gerar PDF/ })).toBeDisabled();
});
it("offers retry after a load failure", async () => {
  let count = 0;
  render(
    <CatalogPage
      repository={{
        listPublished: async () => {
          if (!count++) throw new Error("offline");
          return [];
        },
      }}
      onCompose={() => {}}
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Tentar novamente" }),
  );
  await waitFor(() =>
    expect(
      screen.getByText("Seu acervo ainda está vazio."),
    ).toBeInTheDocument(),
  );
});
it("does not silently use demo with incomplete backend settings", () => {
  expect(() =>
    readConfig({ VITE_SUPABASE_URL: "https://example.supabase.co" }),
  ).toThrow();
  expect(readConfig({})).toEqual({ mode: "demo" });
});
