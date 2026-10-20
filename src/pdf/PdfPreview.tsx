import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function PdfPreview({ bytes }: { bytes: Uint8Array }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null),
    [page, setPage] = useState(1),
    [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    let destroy: (() => Promise<void>) | undefined;
    setDoc(null);
    setPage(1);
    setError("");
    import("./pdfjs")
      .then(({ getDocument }) => {
        if (!active) return;
        const task = getDocument({ data: new Uint8Array(bytes) });
        destroy = () => task.destroy();
        return task.promise.then((pdf) => {
          if (active) setDoc(pdf);
        });
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível mostrar a prévia. Você pode tentar novamente.",
          );
      });
    return () => {
      active = false;
      void destroy?.().catch(() => {});
    };
  }, [bytes]);
  useEffect(() => {
    if (!doc) return;
    let active = true;
    let cancel: (() => void) | undefined;
    doc
      .getPage(page)
      .then((pdfPage) => {
        if (!active || !canvas.current) return;
        const element = canvas.current;
        const native = pdfPage.getViewport({ scale: 1 });
        const containerWidth = element.parentElement?.clientWidth || 600;
        const scale =
          Math.min(1.5, containerWidth / native.width) *
          Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({ scale });
        element.width = viewport.width;
        element.height = viewport.height;
        const task = pdfPage.render({ canvas: element, viewport });
        cancel = () => task.cancel();
        return task.promise;
      })
      .catch((e) => {
        if (active && e?.name !== "RenderingCancelledException")
          setError("Não foi possível renderizar esta página.");
      });
    return () => {
      active = false;
      cancel?.();
    };
  }, [doc, page]);
  return (
    <div className="pdf-preview">
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : (
        <>
          <div className="pdf-canvas-wrap">
            <canvas
              ref={canvas}
              aria-label={"Página " + page + " do PDF"}
              role="img"
            />
          </div>
          <div className="page-navigation">
            <button
              aria-label="Página anterior"
              disabled={!doc || page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Página {page} de {doc?.numPages || "…"}
            </span>
            <button
              aria-label="Próxima página"
              disabled={!doc || page >= doc.numPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
