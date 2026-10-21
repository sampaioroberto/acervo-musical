import { useEffect, useRef, useState } from "react";
import type { AdminRepository } from "../catalog/repository";
import type { AdminSong, SongKind } from "../catalog/types";
import {
  createImportItem,
  createManualItem,
  type ImportItem,
} from "../admin/batch";
import { prepareImport } from "../admin/prepareImport";
import { ImportReview } from "../admin/ImportReview";
import { saveImport } from "../admin/saveImport";
import {
  canJoinNext,
  joinPdfItems,
  splitPdfItem,
  splitNeedsConfirmation,
  suggestsContinuation,
} from "../admin/pdfBatch";
import { validateFiles } from "../import/validate";
import { searchable } from "../catalog/search";
import { SplitSongs } from "./SplitSongs";
export function EventImporter({
  repo,
  catalog,
  onAdded,
  onPendingChange,
  onBusyChange,
}: {
  repo: AdminRepository;
  catalog: AdminSong[];
  onAdded: (song: AdminSong) => void;
  onPendingChange: (count: number) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [kind, setKind] = useState<SongKind>("lyrics"),
    [items, setItems] = useState<ImportItem[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [splitting, setSplitting] = useState<ImportItem | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(
    () => onPendingChange(items.length),
    [items.length, onPendingChange],
  );
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const patch = (id: string, value: Partial<ImportItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...value } : item)),
    );
  const drop = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id));
  async function upload(files: File[]) {
    if (busy) return;
    const checked = validateFiles(files);
    setError(
      checked.rejected.map((item) => item.name + ": " + item.message).join(" "),
    );
    const placeholders = checked.accepted.map((file) =>
      createImportItem(file, kind),
    );
    setItems((current) => [...current, ...placeholders]);
    setBusy(true);
    try {
      for (const item of placeholders) {
        const prepared = await prepareImport(item.file, kind);
        if (!alive.current) return;
        setItems((current) =>
          current.flatMap((old) => (old.id === item.id ? prepared : [old])),
        );
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function save(item: ImportItem) {
    patch(item.id, { status: "saving", saveAttempted: true, error: null });
    try {
      const song = await saveImport(item, "published", repo);
      if (alive.current) {
        onAdded(song);
        drop(item.id);
      }
      return true;
    } catch (cause) {
      if (alive.current)
        patch(item.id, { status: "error", error: (cause as Error).message });
      return false;
    }
  }
  async function publish(item?: ImportItem) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      for (const entry of item
        ? [item]
        : items.filter(
            (i) => i.reviewed && i.draft.title.trim() && i.draft.content.trim(),
          )) {
        if (!alive.current) return;
        await save(entry);
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function join(item: ImportItem, next: ImportItem) {
    if (busy) return;
    setBusy(true);
    try {
      const combined = await joinPdfItems(item, next);
      if (alive.current)
        setItems((current) =>
          current.flatMap((old) =>
            old.id === item.id ? [combined] : old.id === next.id ? [] : [old],
          ),
        );
    } catch {
      if (alive.current)
        setError("Não foi possível juntar as páginas. Tente novamente.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function split(item: ImportItem) {
    if (busy) return;
    const edited = splitNeedsConfirmation(item);
    if (
      edited &&
      !window.confirm(
        "Separar páginas restaura o texto original e descarta os ajustes. Continuar?",
      )
    )
      return;
    try {
      const parts = splitPdfItem(item, edited);
      setItems((current) =>
        current.flatMap((old) => (old.id === item.id ? parts : [old])),
      );
    } catch {
      setError("Não foi possível separar as páginas.");
    }
  }
  function markAll() {
    if (!busy)
      setItems((current) =>
        current.map((item) =>
          item.draft.title.trim() && item.draft.content.trim()
            ? { ...item, reviewed: true }
            : item,
        ),
      );
  }
  return (
    <section className="event-import" aria-label="Adicionar músicas novas">
      <h3>Adicionar músicas novas</h3>
      <p>
        Confira e publique no acervo. As músicas serão adicionadas a este
        evento.
      </p>
      <div className="form-actions">
        <label>
          Tipo dos arquivos
          <select
            aria-label="Tipo dos arquivos"
            value={kind}
            disabled={busy}
            onChange={(e) => setKind(e.target.value as SongKind)}
          >
            <option value="lyrics">Letras</option>
            <option value="chords">Cifras</option>
          </select>
        </label>
        <label className="button secondary">
          Enviar arquivos
          <input
            aria-label="Enviar arquivos para o evento"
            type="file"
            accept=".pdf,.docx"
            multiple
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void upload(files);
            }}
          />
        </label>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() =>
            setItems((current) => [...current, createManualItem(kind)])
          }
        >
          Digitar música
        </button>
      </div>
      <p className="catalog-hint">
        DOCX ou PDF · Até 20 arquivos de 10 MiB.{" "}
        {kind === "chords"
          ? "Junte páginas de continuação antes de publicar."
          : "Use “Dividir em músicas” se o arquivo reunir várias letras."}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {items.map((item, index) => {
        const matches = catalog.filter(
          (song) =>
            song.status === "published" &&
            song.kind === item.draft.kind &&
            searchable(song.title) === searchable(item.draft.title),
        );
        return (
          <div key={item.id}>
            {matches.length > 0 && (
              <div className="warning">
                <p>Já existe uma música com este título e tipo.</p>
                {matches.map((song) => (
                  <button
                    className="button secondary"
                    disabled={busy}
                    key={song.id}
                    onClick={() => {
                      onAdded(song);
                      drop(item.id);
                    }}
                  >
                    Usar “{song.title}” do acervo
                  </button>
                ))}
              </div>
            )}
            <ImportReview
              item={item}
              duplicate={false}
              busy={busy}
              publishOnly
              onChange={(value) => patch(item.id, value)}
              onSave={() => void publish(item)}
              onRemove={() => {
                if (
                  !busy &&
                  window.confirm(
                    "Remover esta música da revisão? O acervo não será alterado.",
                  )
                )
                  drop(item.id);
              }}
              onSplitText={
                !item.saveAttempted ? () => setSplitting(item) : undefined
              }
              continuation={suggestsContinuation(item, items[index + 1])}
              onJoin={
                canJoinNext(item, items[index + 1])
                  ? () => void join(item, items[index + 1])
                  : undefined
              }
              onSplit={
                item.pdf && item.pdf.pages.length > 1 && !item.saveAttempted
                  ? () => split(item)
                  : undefined
              }
            />
          </div>
        );
      })}
      {items.length > 0 && (
        <div className="form-actions">
          <button
            className="button secondary"
            disabled={
              busy ||
              !items.some(
                (item) =>
                  !item.reviewed &&
                  item.draft.title.trim() &&
                  item.draft.content.trim(),
              )
            }
            onClick={markAll}
          >
            Marcar todos como revisados
          </button>
          <button
            className="button primary"
            disabled={busy || !items.some((item) => item.reviewed)}
            onClick={() => void publish()}
          >
            Publicar no acervo e adicionar
          </button>
        </div>
      )}
      {splitting && (
        <SplitSongs
          draft={splitting.draft}
          onClose={() => setSplitting(null)}
          onSplit={(parts) => {
            setItems((current) =>
              current.flatMap((item) =>
                item.id === splitting.id
                  ? parts.map((draft) => ({
                      ...createManualItem(draft.kind),
                      draft,
                    }))
                  : [item],
              ),
            );
            setSplitting(null);
          }}
        />
      )}
    </section>
  );
}
