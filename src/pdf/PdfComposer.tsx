import { useState } from "react";
import { X, Download, Type, RotateCcw } from "lucide-react";
import type { PrintSong, LyricOptions, FontFamily } from "./types";
import { usePdfPreview } from "./usePdfPreview";
import { PdfPreview } from "./PdfPreview";
import { Dialog } from "../app/Dialog";
export function PdfComposer({
  songs,
  onClose,
}: {
  songs: readonly PrintSong[];
  onClose: () => void;
}) {
  const [options, setOptions] = useState<LyricOptions>({
    family: "sans",
    sizing: { mode: "auto" },
  });
  const preview = usePdfPreview(songs, options);
  const lyrics = songs[0]?.kind === "lyrics";
  const fontSize =
    options.sizing.mode === "manual"
      ? options.sizing.size
      : preview.result?.ok
        ? preview.result.fontSize
        : 12;
  return (
    <Dialog label="Prévia do PDF" onClose={onClose}>
      <div className="composer-heading">
        <div>
          <h2>Prévia do PDF</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Fechar prévia"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="composer-grid">
        <div className="composer-options">
          <p className="composition-format">
            {lyrics
              ? `${songs.length} ${songs.length === 1 ? "letra" : "letras"} · ${Math.ceil(songs.length / 4)} ${songs.length <= 4 ? "folha A4" : "folhas A4"}`
              : `${songs.length} ${songs.length === 1 ? "cifra" : "cifras"} · Cada música em uma nova página`}
          </p>
          <ol className="composition-songs">
            {songs.map((s) => (
              <li key={s.id}>{s.title}</li>
            ))}
          </ol>
          {lyrics && (
            <section className="typography-controls">
              <h3>
                <Type size={17} />
                Aparência das letras
              </h3>
              <label>
                Fonte das letras
                <select
                  value={options.family}
                  onChange={(e) =>
                    setOptions((old) => ({
                      ...old,
                      family: e.target.value as FontFamily,
                    }))
                  }
                >
                  <option value="sans">Noto Sans · Simples</option>
                  <option value="serif">Noto Serif · Clássica</option>
                  <option value="mono">Noto Sans Mono · Monoespaçada</option>
                </select>
              </label>
              <label>
                Tamanho da fonte
                <div className="font-size-controls">
                  <button
                    aria-label="Diminuir fonte"
                    disabled={fontSize <= 9}
                    onClick={() =>
                      setOptions({
                        ...options,
                        sizing: {
                          mode: "manual",
                          size: Math.max(9, fontSize - 1),
                        },
                      })
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={9}
                    max={16}
                    step={1}
                    aria-label="Tamanho da fonte"
                    value={Number.isFinite(fontSize) ? fontSize : ""}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        sizing: {
                          mode: "manual",
                          size: e.target.valueAsNumber,
                        },
                      })
                    }
                  />
                  <span>pt</span>
                  <button
                    aria-label="Aumentar fonte"
                    disabled={fontSize >= 16}
                    onClick={() =>
                      setOptions({
                        ...options,
                        sizing: {
                          mode: "manual",
                          size: Math.min(16, fontSize + 1),
                        },
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </label>
              <p className="sizing-status">
                {options.sizing.mode === "auto"
                  ? "Ajuste automático ativo"
                  : "Ajuste manual"}
              </p>
              <button
                className="text-button"
                onClick={() =>
                  setOptions({ ...options, sizing: { mode: "auto" } })
                }
              >
                <RotateCcw size={12} /> Ajuste automático
              </button>
            </section>
          )}
          <div aria-live="polite">
            {preview.status === "loading" && (
              <p className="status">Preparando seu PDF…</p>
            )}
            {preview.status === "error" && (
              <p className="error">
                Não foi possível gerar o PDF. Feche a prévia e tente novamente.
              </p>
            )}
            {preview.result &&
              !preview.result.ok &&
              preview.result.issues.map((issue, i) => (
                <div key={i} className="error">
                  <p>{issue.message}</p>
                  {issue.songIds.length > 0 && (
                    <small>
                      {songs
                        .filter((s) => issue.songIds.includes(s.id))
                        .map((s) => s.title)
                        .join(" · ")}
                    </small>
                  )}
                </div>
              ))}
          </div>
          <button
            className="button primary download-button"
            disabled={preview.status !== "ready"}
            onClick={preview.download}
          >
            <Download size={17} />
            Baixar PDF
          </button>
          <p className="print-note">Imprima em A4, com escala de 100%.</p>
        </div>
        <div className="composer-document">
          {preview.result?.ok ? (
            <PdfPreview bytes={preview.result.bytes} />
          ) : (
            <div className="preview-placeholder">
              <Type size={35} strokeWidth={1} />
              <p>
                {preview.status === "loading"
                  ? "Montando sua página…"
                  : "Ajuste as opções para visualizar o PDF."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
