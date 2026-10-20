import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  LogOut,
  Pencil,
  Trash2,
  FileText,
  PenLine,
} from "lucide-react";
import type { AdminRepository } from "../catalog/repository";
import type {
  AdminSong,
  OriginalRef,
  SongKind,
  SongStatus,
} from "../catalog/types";
import {
  createImportItem,
  createManualItem,
  duplicateIds,
  type ImportItem,
} from "./batch";
import { saveImport } from "./saveImport";
import { validateFiles } from "../import/validate";
import { prepareImport } from "./prepareImport";
import {
  canJoinNext,
  suggestsContinuation,
  joinPdfItems,
  splitPdfItem,
  splitNeedsConfirmation,
} from "./pdfBatch";
import { ImportReview } from "./ImportReview";
import { SongEditor } from "./SongEditor";
export function AdminWorkspace({
  repo,
  onSignOut,
  signOutError,
}: {
  repo: AdminRepository;
  onSignOut: () => void;
  signOutError: string;
}) {
  const [records, setRecords] = useState<AdminSong[]>([]),
    [pending, setPending] = useState<OriginalRef[]>([]),
    [items, setItems] = useState<ImportItem[]>([]);
  const [kind, setKind] = useState<SongKind>("lyrics"),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [fileErrors, setFileErrors] = useState<string[]>([]),
    [editing, setEditing] = useState<AdminSong | null>(null),
    [deleting, setDeleting] = useState<string | null>(null);
  const request = useRef(0),
    mounted = useRef(true);
  const reload = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    try {
      const [songs, cleanup] = await Promise.all([
        repo.listAdmin(),
        repo.listPendingCleanup(),
      ]);
      if (mounted.current && version === request.current) {
        setRecords(songs);
        setPending(cleanup);
      }
    } catch {
      if (mounted.current)
        setError("Não foi possível carregar a administração. Tente novamente.");
    } finally {
      if (mounted.current && version === request.current) setLoading(false);
    }
  }, [repo]);
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
      request.current++;
    };
  }, [reload]);
  const patch = (id: string, update: Partial<ImportItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  const saving = items.some((i) => i.status === "saving"),
    locked = busy || saving,
    duplicates = duplicateIds(records, items);
  async function upload(files: File[]) {
    if (!files.length) return;
    if (
      items.some((i) => i.status !== "saved") &&
      !window.confirm("Descartar a revisão atual e carregar outro lote?")
    )
      return;
    const checked = validateFiles(files);
    setFileErrors(checked.rejected.map((f) => f.name + ": " + f.message));
    const next = checked.accepted.map((file) => createImportItem(file, kind));
    setItems(next);
    setNotice("");
    setBusy(true);
    try {
      for (const item of next) {
        const prepared = await prepareImport(item.file, kind);
        if (!mounted.current) return;
        setItems((current) =>
          current.flatMap((entry) =>
            entry.id === item.id ? prepared : [entry],
          ),
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function join(item: ImportItem, next: ImportItem) {
    if (locked || !canJoinNext(item, next)) return;
    setBusy(true);
    setError("");
    try {
      const combined = await joinPdfItems(item, next);
      if (mounted.current)
        setItems((current) =>
          current.flatMap((entry) =>
            entry.id === item.id
              ? [combined]
              : entry.id === next.id
                ? []
                : [entry],
          ),
        );
    } catch {
      if (mounted.current)
        setError(
          "Não foi possível juntar as páginas. O texto continua aqui para tentar novamente.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function split(item: ImportItem) {
    if (locked) return;
    const edited = splitNeedsConfirmation(item);
    if (
      edited &&
      !window.confirm(
        "Separar páginas restaura o texto extraído do PDF e descarta os ajustes deste item. Continuar?",
      )
    )
      return;
    try {
      const separated = splitPdfItem(item, edited);
      setItems((current) =>
        current.flatMap((entry) =>
          entry.id === item.id ? separated : [entry],
        ),
      );
    } catch {
      setError("Não foi possível separar as páginas. O texto continua aqui.");
    }
  }
  function removeFromReview(item: ImportItem) {
    if (locked || item.status === "saved") return;
    if (
      !window.confirm(
        `Remover “${item.draft.title.trim() || "Nova música"}” desta revisão? Músicas já salvas no acervo não serão excluídas.`,
      )
    )
      return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setNotice("");
  }
  function markAllReviewed() {
    if (locked) return;
    setItems((current) =>
      current.map((item) =>
        item.status !== "saved" &&
        item.draft.title.trim() &&
        item.draft.content.trim()
          ? { ...item, reviewed: true }
          : item,
      ),
    );
  }
  async function saveOne(item: ImportItem, status: SongStatus) {
    setNotice("");
    patch(item.id, { status: "saving", error: null, saveAttempted: true });
    try {
      await saveImport(item, status, repo);
      if (status === "published") {
        const next = item.file ? null : createManualItem(item.draft.kind);
        setItems((current) =>
          current.flatMap((entry) =>
            entry.id !== item.id ? [entry] : next ? [next] : [],
          ),
        );
        setNotice("Publicado no acervo");
      } else {
        patch(item.id, { status: "saved", savedAs: status });
      }
      await reload();
      return true;
    } catch (e) {
      patch(item.id, { status: "error", error: (e as Error).message });
      return false;
    }
  }
  async function saveBatch(status: SongStatus) {
    setBusy(true);
    setNotice("");
    let total = 0;
    try {
      for (const item of items.filter(
        (i) =>
          i.status !== "saved" &&
          !!i.draft.title.trim() &&
          !!i.draft.content.trim() &&
          (status === "draft" || i.reviewed),
      ))
        if (await saveOne(item, status)) total++;
      setNotice(total + " música" + (total === 1 ? " salva." : "s salvas."));
    } finally {
      setBusy(false);
    }
  }
  async function remove(song: AdminSong) {
    if (!window.confirm("Excluir “" + song.title + "” do acervo?")) return;
    setDeleting(song.id);
    setError("");
    try {
      const original = await repo.deleteSong(song.id);
      if (original) {
        try {
          await repo.removeOriginal(original);
        } catch {
          setError(
            "A música foi excluída, mas a remoção do arquivo original precisa ser repetida.",
          );
        }
      }
      await reload();
    } catch {
      setError("Não foi possível excluir a música. Tente novamente.");
    } finally {
      setDeleting(null);
    }
  }
  async function cleanup(ref: OriginalRef) {
    setError("");
    try {
      await repo.removeOriginal(ref);
      await reload();
    } catch {
      setError("Não foi possível remover esse arquivo. Tente novamente.");
    }
  }
  const validItems = items.filter(
    (i) =>
      i.status !== "saved" &&
      !!i.draft.title.trim() &&
      !!i.draft.content.trim(),
  );
  return (
    <main className="page admin-page">
      <div className="admin-heading">
        <div>
          <h1>Administrar acervo</h1>
        </div>
        <button className="button secondary" onClick={onSignOut}>
          <LogOut size={15} />
          Sair
        </button>
      </div>
      {(error || signOutError) && (
        <div className="error-box" role="alert">
          <p>{error || signOutError}</p>
          <button
            className="text-button"
            onClick={() => {
              setError("");
              void reload();
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="admin-grid">
        <section className="upload-section">
          <div className="section-heading">
            <div>
              <h2>Adicionar músicas</h2>
            </div>
          </div>
          <div className="add-methods">
            <label className="batch-kind">
              Tipo
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as SongKind)}
                disabled={locked}
              >
                <option value="lyrics">Letras</option>
                <option value="chords">Cifras</option>
              </select>
            </label>
            <button
              className="button secondary"
              disabled={locked}
              onClick={() => {
                setItems((current) => [...current, createManualItem(kind)]);
                setNotice("");
              }}
            >
              <PenLine size={16} /> Digitar
            </button>
          </div>
          <label className={"upload-zone " + (locked ? "is-busy" : "")}>
            <Upload size={29} strokeWidth={1.3} />
            <strong>{busy ? "Lendo arquivos…" : "Enviar arquivos"}</strong>
            <span>DOCX ou PDF · Até 20 arquivos de 10 MiB cada</span>
            <small>
              {kind === "chords"
                ? "PDF: uma cifra por página. Junte continuações na revisão."
                : "Um arquivo por música."}
            </small>
            <input
              type="file"
              multiple
              accept=".docx,.pdf"
              aria-label="Enviar arquivos"
              disabled={locked}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void upload(files);
              }}
            />
          </label>
          {fileErrors.map((e, i) => (
            <p key={i} className="error" role="alert">
              {e}
            </p>
          ))}
          {notice && (
            <p className="success status" role="status">
              {notice}
            </p>
          )}
          {items.length > 0 && (
            <div className="batch-review">
              <div className="batch-heading">
                <h3>
                  Músicas para salvar <span>{items.length}</span>
                </h3>
                <div className="batch-actions">
                  <button
                    className="text-button"
                    disabled={
                      locked || !validItems.some((item) => !item.reviewed)
                    }
                    onClick={markAllReviewed}
                  >
                    Marcar todos como revisados
                  </button>
                  <button
                    className="text-button"
                    disabled={locked}
                    onClick={() => {
                      if (
                        items.every((i) => i.status === "saved") ||
                        window.confirm(
                          "Descartar os itens ainda não salvos desta revisão?",
                        )
                      ) {
                        setItems([]);
                        setNotice("");
                      }
                    }}
                  >
                    Limpar revisão
                  </button>
                </div>
              </div>
              {items.map((item, index) => (
                <ImportReview
                  key={item.id}
                  item={item}
                  duplicate={duplicates.has(item.id)}
                  busy={locked}
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
                  onChange={(update) => patch(item.id, update)}
                  onRemove={
                    item.status !== "saved"
                      ? () => removeFromReview(item)
                      : undefined
                  }
                  onSave={(status) => void saveOne(item, status)}
                />
              ))}
              <div
                className="form-actions bulk-actions"
                role="group"
                aria-label="Ações do lote"
              >
                <button
                  className="button secondary"
                  disabled={locked || !validItems.length}
                  onClick={() => void saveBatch("draft")}
                >
                  Salvar rascunhos
                </button>
                <button
                  className="button secondary"
                  disabled={
                    locked || !validItems.some((item) => !item.reviewed)
                  }
                  onClick={markAllReviewed}
                >
                  Marcar todos como revisados
                </button>
                <button
                  className="button primary"
                  disabled={locked || !validItems.some((i) => i.reviewed)}
                  onClick={() => void saveBatch("published")}
                >
                  Publicar revisados
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="managed-catalog" aria-label="Músicas cadastradas">
          <div className="section-heading">
            <div>
              <h2>Músicas cadastradas</h2>
            </div>
            <span className="count-label">{records.length}</span>
          </div>
          {loading && <p className="status">Carregando músicas…</p>}
          {!loading && !records.length && (
            <div className="empty">
              <FileText size={28} strokeWidth={1} />
              <p>Nenhuma música cadastrada.</p>
            </div>
          )}
          <div className="admin-records">
            {records.map((song) => (
              <article key={song.id} className="admin-record">
                <div>
                  <h3>{song.title}</h3>
                  <p>
                    {song.kind === "lyrics" ? "Letra" : "Cifra"}
                    {song.artist && <> · {song.artist}</>}
                  </p>
                  <span className={"publication-status " + song.status}>
                    {song.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                <div className="record-actions">
                  <button
                    className="icon-button"
                    aria-label={"Editar " + song.title}
                    onClick={() => setEditing(song)}
                    disabled={deleting === song.id}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Excluir " + song.title}
                    onClick={() => void remove(song)}
                    disabled={deleting === song.id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {pending.length > 0 && (
            <section className="pending-cleanup">
              <h3>Arquivos aguardando remoção</h3>
              <p className="catalog-hint">
                As músicas já foram excluídas. Você pode repetir a limpeza dos
                originais.
              </p>
              {pending.map((ref) => (
                <div key={ref.id}>
                  <span>{ref.name}</span>
                  <button
                    className="text-button"
                    onClick={() => void cleanup(ref)}
                  >
                    Tentar remover arquivo
                  </button>
                </div>
              ))}
            </section>
          )}
        </section>
      </div>
      {editing && (
        <SongEditor
          key={editing.id}
          song={editing}
          repo={repo}
          onClose={() => setEditing(null)}
          onSaved={() => void reload()}
        />
      )}
    </main>
  );
}
