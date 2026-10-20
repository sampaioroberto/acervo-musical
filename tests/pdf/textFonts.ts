import {
  PDFDocument,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";

export function textFonts(pdf: PDFDocument, pageIndex = 0): string[] {
  const contents = pdf.getPage(pageIndex).node.Contents() as PDFArray;
  const operators = contents
    .asArray()
    .map((ref) => {
      const stream = pdf.context.lookup(ref);
      if (!(stream instanceof PDFRawStream))
        throw new Error("Expected a PDF content stream");
      return Buffer.from(decodePDFRawStream(stream).decode()).toString(
        "latin1",
      );
    })
    .join("\n");
  return [...operators.matchAll(/\/([^\s]+)\s+[\d.]+\s+Tf/g)].map((m) => m[1]);
}
