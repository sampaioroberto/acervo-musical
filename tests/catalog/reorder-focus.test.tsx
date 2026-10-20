import { it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogPage } from "../../src/catalog/CatalogPage";
import { createDemoRepository } from "../../src/catalog/demoRepository";
it("keeps keyboard focus with the song after moving it in the selection", async () => {
  render(
    <CatalogPage repository={createDemoRepository()} onCompose={() => {}} />,
  );
  for (const button of await screen.findAllByRole("button", {
    name: /^Selecionar /,
  }))
    fireEvent.click(button);
  const up = screen.getByRole("button", {
    name: "Subir Casa de vento",
  });
  up.focus();
  fireEvent.click(up);
  expect(document.activeElement).toHaveAccessibleName("Subir Casa de vento");
});
