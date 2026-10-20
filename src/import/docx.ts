import { unzipSync, strFromU8 } from "fflate";
import { DocumentImportError } from "./types";
import { normalizeText } from "./normalize";
export async function extractDocx(
  data: ArrayBuffer,
): Promise<{ text: string; warnings: string[] }> {
  try {
    let oversized = false;
    const entries = unzipSync(new Uint8Array(data), {
      filter: (file) => {
        if (file.name !== "word/document.xml") return false;
        if (file.originalSize > 16 * 1024 * 1024) {
          oversized = true;
          return false;
        }
        return true;
      },
    });
    if (oversized)
      throw new DocumentImportError(
        "size",
        "O conteúdo deste Word é muito grande para importar. Divida o documento em arquivos menores.",
      );
    const bytes = entries["word/document.xml"];
    if (!bytes) throw new Error("Missing Word XML");
    const xml = strFromU8(bytes);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported XML");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const ns = doc.documentElement.namespaceURI ?? "";
    if (
      doc.getElementsByTagName("parsererror").length ||
      doc.documentElement.localName !== "document" ||
      ![
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "http://purl.oclc.org/ooxml/wordprocessingml/main",
      ].includes(ns)
    )
      throw new Error("Invalid Word XML");
    const extract = (node: Element): string => {
      if (node.namespaceURI === ns) {
        if (node.localName === "t") return node.textContent ?? "";
        if (node.localName === "tab") return "\t";
        if (node.localName === "br" || node.localName === "cr") return "\n";
      }
      return Array.from(node.children).map(extract).join("");
    };
    const text = Array.from(doc.getElementsByTagNameNS(ns, "p"))
      .map(extract)
      .join("\n");
    const warnings = doc.getElementsByTagNameNS(ns, "tbl").length
      ? [
          "O documento contém uma tabela. Confira a ordem dos trechos e os espaços na revisão.",
        ]
      : [];
    return { text: normalizeText(text), warnings };
  } catch (error) {
    if (error instanceof DocumentImportError) throw error;
    throw new DocumentImportError(
      "invalid",
      "Não foi possível ler este Word. Verifique se o arquivo é um DOCX válido.",
    );
  }
}
