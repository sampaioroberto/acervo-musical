import { it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CatalogPage } from "../../src/catalog/CatalogPage";
import { createDemoRepository } from "../../src/catalog/demoRepository";
import { readConfig } from "../../src/app/config";
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
