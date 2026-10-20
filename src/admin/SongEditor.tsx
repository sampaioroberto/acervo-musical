import { useState } from "react";
import { X } from "lucide-react";
import type { AdminRepository } from "../catalog/repository";
import type { AdminSong, SongDraft, SongStatus } from "../catalog/types";
import { SongFields } from "./SongFields";
import { Dialog } from "../app/Dialog";
import { SinglePreview } from "./SinglePreview";
import { normalizeText } from "../import/normalize";
export function SongEditor({
  song,
  repo,
  onClose,
  onSaved,
}: {
  song: AdminSong;
  repo: AdminRepository;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<SongDraft>(song),
    [reviewed, setReviewed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<SongDraft | null>(null);
  const valid = !!value.title.trim() && !!value.content.trim();
  async function save(status: SongStatus) {
    if (!valid || (status === "published" && !reviewed)) return;
    setBusy(true);
    setError("");
    try {
      await repo.save(
        {
          ...song,
          ...value,
          title: value.title.trim(),
          artist: value.artist.trim(),
          content: normalizeText(value.content),
          status,
        },
        song.original,
      );
      onSaved();
      onClose();
    } catch {
      setError(
        "Não foi possível salvar. O conteúdo continua aqui para tentar novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog label="Editar música" onClose={onClose}>
      <div className="composer-heading">
        <div>
          <p className="eyebrow">ADMINISTRAÇÃO</p>
          <h2>Editar música</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Fechar edição"
          disabled={busy}
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="editor-body">
        <SongFields
          value={value}
          onChange={(s) => {
            setValue(s);
            setReviewed(false);
          }}
          disabled={busy}
        />
        <label className="review-check">
          <input
            type="checkbox"
            checked={reviewed}
            disabled={busy || !valid}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          Conferi o conteúdo antes de publicar.
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            disabled={busy || !valid}
            onClick={() => setPreview({ ...value })}
          >
            Ver prévia
          </button>
          <button
            className="button secondary"
            disabled={busy || !valid}
            onClick={() => void save("draft")}
          >
            Salvar rascunho
          </button>
          <button
            className="button primary"
            disabled={busy || !valid || !reviewed}
            onClick={() => void save("published")}
          >
            {busy ? "Salvando…" : "Publicar alterações"}
          </button>
        </div>
      </div>
      {preview && (
        <SinglePreview song={preview} onClose={() => setPreview(null)} />
      )}
    </Dialog>
  );
}
