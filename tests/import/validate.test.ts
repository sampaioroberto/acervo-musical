import { it, expect } from "vitest";
import { validateFiles } from "../../src/import/validate";
import { importFile } from "../../src/import/importFile";
it("rejects a batch of twenty-one and separates invalid individual files", () => {
  const files = Array.from(
    { length: 21 },
    (_, i) => new File(["%PDF-"], i + ".PDF", { type: "application/pdf" }),
  );
  expect(validateFiles(files).accepted).toHaveLength(0);
  expect(validateFiles(files).rejected).toHaveLength(21);
  const result = validateFiles([files[0], new File(["x"], "imagem.png")]);
  expect(result.accepted).toHaveLength(1);
  expect(result.rejected).toHaveLength(1);
});
it("accepts exactly ten MiB and rejects one byte more or empty files", () => {
  const max = new File([new Uint8Array(10485760)], "Letra.DOCX");
  const large = new File([new Uint8Array(10485761)], "Letra.docx");
  const r = validateFiles([max, large, new File([], "vazio.pdf")]);
  expect(r.accepted).toEqual([max]);
  expect(r.rejected).toHaveLength(2);
});
it("rejects a PDF extension on non-PDF content", async () => {
  const f = new File(["not a pdf"], "Letra.pdf");
  Object.defineProperty(f, "arrayBuffer", {
    value: async () => new TextEncoder().encode("not a pdf").buffer,
  });
  expect(await importFile(f, "lyrics")).toMatchObject({
    ok: false,
    code: "invalid",
  });
});
