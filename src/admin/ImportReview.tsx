import { useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";
import type { ImportItem } from "./batch";
import type { SongDraft, SongStatus } from "../catalog/types";
import { SongFields } from "./SongFields";
import { SinglePreview } from "./SinglePreview";
export function ImportReview({
  item,
  duplicate,
  busy,
  onChange,
  onSave,
  onJoin,
  onSplit,
  continuation = false,
}: {
  item: ImportItem;
  duplicate: boolean;
  busy: boolean;
  onChange: (patch: Partial<ImportItem>) => void;
  onSave: (status: SongStatus) => void;
  onJoin?: () => void;
  onSplit?: () => void;
  continuation?: boolean;
}) {
  const [preview, setPreview] = useState<SongDraft | null>(null);
  const locked = busy || ["importing", "saving", "saved"].includes(item.status);
  const valid = !!item.draft.title.trim() && !!item.draft.content.trim();
  return (
    <fieldset className="import-review" disabled={locked}>
      <legend>{item.file?.name ?? "Nova música"}</legend>
      <div className="import-state">
        {item.status === "importing" ? (
          "Extraindo o conteúdo…"
        ) : item.status === "saving" ? (
          "Salvando…"
        ) : item.status === "saved" ? (
          <span className="success">
            <CheckCircle2 size={16} />
            {item.savedAs === "published"
              ? "Publicado no acervo"
              : "Rascunho salvo"}
          </span>
        ) : (
          "Confira o conteúdo antes de salvar."
        )}
      </div>
      {item.pdf && (
        <div className="pdf-page-actions">
          <p className="pdf-source">
            {item.pdf.sourceName} ·{" "}
            {item.pdf.pages.length === 1 ? "página " : "páginas "}
            {item.pdf.pages.map((p) => p.number).join(", ")}
          </p>
          {continuation && (
            <p className="warning">
              A próxima página pode ser continuação desta cifra.
            </p>
          )}
          <div className="form-actions">
            {onJoin && (
              <button
                className="button secondary"
                type="button"
                onClick={onJoin}
                disabled={locked}
              >
                Juntar com a próxima página
              </button>
            )}
            {onSplit && (
              <button
                className="button secondary"
                type="button"
                onClick={onSplit}
                disabled={locked}
              >
                Separar páginas
              </button>
            )}
          </div>
        </div>
      )}
      {item.error && (
        <p className="error" role="alert">
          {item.error}
          {item.file && item.attachOriginal === false
            ? " Você pode cadastrar a música colando o texto abaixo. O arquivo original não será anexado."
            : ""}
        </p>
      )}
      {item.warnings.map((w, i) => (
        <p key={i} className="warning">
          {w}
        </p>
      ))}
      {duplicate && (
        <p className="warning">
          Já existe uma música com este título, artista e tipo. Confira antes de
          salvar; ela não será substituída.
        </p>
      )}
      <SongFields
        value={item.draft}
        disabled={locked}
        autoFocusTitle={!item.file}
        contentLabel={
          item.file
            ? "Conteúdo"
            : item.draft.kind === "lyrics"
              ? "Letra"
              : "Cifra"
        }
        onChange={(draft) =>
          onChange({ draft, reviewed: false, status: "review" })
        }
      />
      <label className="review-check">
        <input
          type="checkbox"
          checked={item.reviewed}
          disabled={!valid || locked}
          onChange={(e) => onChange({ reviewed: e.target.checked })}
        />
        Conferi o texto, as quebras de linha e o alinhamento.
      </label>
      <div className="form-actions">
        <button
          className="button secondary"
          type="button"
          disabled={!valid || locked}
          onClick={() => setPreview({ ...item.draft })}
        >
          <Eye size={15} />
          Ver prévia
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!valid || locked}
          onClick={() => onSave("draft")}
        >
          Salvar rascunho
        </button>
        <button
          className="button primary"
          type="button"
          disabled={!valid || !item.reviewed || locked}
          onClick={() => onSave("published")}
        >
          Publicar
        </button>
      </div>
      {preview && (
        <SinglePreview song={preview} onClose={() => setPreview(null)} />
      )}
    </fieldset>
  );
}
