import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function pdfContents(bytes: Uint8Array) {
  const task = getDocument({ data: new Uint8Array(bytes) });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      pages.push(
        content.items.flatMap((item) =>
          "str" in item && item.str.trim()
            ? [{ text: item.str, x: item.transform[4], y: item.transform[5] }]
            : [],
        ),
      );
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
