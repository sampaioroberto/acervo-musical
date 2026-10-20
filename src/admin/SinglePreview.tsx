import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { SongDraft } from "../catalog/types";
import type { PdfResult } from "../pdf/types";
import { previewSongPdf } from "../pdf/previewSong";
import { browserFonts } from "../pdf/fonts";
import { PdfPreview } from "../pdf/PdfPreview";
import { Dialog } from "../app/Dialog";
export function SinglePreview({
  song,
  onClose,
}: {
  song: SongDraft;
  onClose: () => void;
}) {
  const [result, setResult] = useState<PdfResult | null>(null);
  useEffect(() => {
    let active = true;
    previewSongPdf(
      song,
      { family: "sans", sizing: { mode: "auto" } },
      browserFonts,
    )
      .then((r) => {
        if (active) setResult(r);
      })
      .catch(() => {
        if (active)
          setResult({
            ok: false,
            issues: [
              {
                code: "font-load",
                songIds: [],
                message: "Não foi possível gerar a prévia. Tente novamente.",
              },
            ],
          });
      });
    return () => {
      active = false;
    };
  }, [song]);
  return (
    <Dialog label="Prévia da música" onClose={onClose}>
      <div className="composer-heading">
        <div>
          <p className="eyebrow">CONFERIR ANTES DE PUBLICAR</p>
          <h2>{song.title || "Prévia da música"}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Fechar prévia da música"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <div className="single-preview">
        {!result ? (
          <p className="status">Preparando a prévia…</p>
        ) : result.ok ? (
          <>
            <p className="catalog-hint">
              {song.kind === "lyrics"
                ? "Prévia individual na largura de uma coluna. A composição final acomoda duas letras em cada coluna."
                : "Confira os acordes e as quebras de página."}
            </p>
            <PdfPreview bytes={result.bytes} />
          </>
        ) : (
          result.issues.map((i, n) => (
            <p className="error" role="alert" key={n}>
              {i.message}
            </p>
          ))
        )}
      </div>
    </Dialog>
  );
}
