import { useState } from "react";
import type { SongDraft } from "../catalog/types";
import { SongFields } from "../admin/SongFields";
import { Dialog } from "../app/Dialog";
export function SplitSongs({
  draft,
  onSplit,
  onClose,
}: {
  draft: SongDraft;
  onSplit: (parts: SongDraft[]) => void;
  onClose: () => void;
}) {
  const blank = () => ({
    title: "",
    artist: "",
    kind: draft.kind,
    content: "",
  });
  const [parts, setParts] = useState<SongDraft[]>([{ ...draft }, blank()]);
  return (
    <Dialog label="Dividir em músicas" onClose={onClose}>
      <div className="composer-heading">
        <h2>Dividir em músicas</h2>
        <button className="button secondary" onClick={onClose}>
          Cancelar divisão
        </button>
      </div>
      <div className="event-split">
        <p>
          Distribua os textos entre as músicas e confira cada título. Serão
          salvos os textos; o PDF original não será anexado às partes divididas
          manualmente.
        </p>
        <label>
          Texto original
          <textarea
            aria-label="Texto original"
            readOnly
            value={draft.content}
            rows={5}
          />
        </label>
        {parts.map((part, index) => (
          <fieldset key={index}>
            <legend>Música {index + 1}</legend>
            <SongFields
              value={part}
              onChange={(value) =>
                setParts((current) =>
                  current.map((old, n) => (n === index ? value : old)),
                )
              }
            />
            <button
              className="text-button"
              disabled={parts.length <= 2}
              onClick={() =>
                setParts((current) => current.filter((_, n) => n !== index))
              }
            >
              Remover parte {index + 1}
            </button>
          </fieldset>
        ))}
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={() => setParts((current) => [...current, blank()])}
          >
            Adicionar outra música
          </button>
          <button
            className="button primary"
            disabled={parts.some(
              (part) => !part.title.trim() || !part.content.trim(),
            )}
            onClick={() => onSplit(parts)}
          >
            Concluir divisão
          </button>
        </div>
      </div>
    </Dialog>
  );
}
