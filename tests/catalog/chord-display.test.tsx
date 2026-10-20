import { it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogPage } from "../../src/catalog/CatalogPage";
import { createDemoRepository } from "../../src/catalog/demoRepository";
import { readFileSync } from "node:fs";
const styles = readFileSync("src/app/styles.css", "utf8");
it("preserves chord lines with horizontal scrolling while lyrics can wrap", async () => {
  const style = document.createElement("style");
  style.textContent = styles;
  document.head.append(style);
  try {
    render(
      <CatalogPage repository={createDemoRepository()} onCompose={() => {}} />,
    );
    await screen.findAllByRole("button", { name: /Selecionar / });
    fireEvent.click(screen.getByRole("button", { name: "Cifras" }));
    fireEvent.click(
      await screen.findByRole("button", { name: /^Canção do amanhecer/ }),
    );
    const chord = document.querySelector(".song-content.mono")!;
    expect(getComputedStyle(chord).whiteSpace).toBe("pre");
    expect(getComputedStyle(chord).overflowX).toBe("auto");
  } finally {
    style.remove();
  }
});
