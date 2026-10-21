import { useEffect, useRef, useState } from "react";
import type { AdminRepository } from "../catalog/repository";
import type { AdminSong, SongKind, SongStatus } from "../catalog/types";
import { filterSongs } from "../catalog/search";
import type { ArchiveEvent, EventRepository, EventSong } from "./types";
import { validateEvent, songTitleKey, moveEventSong } from "./model";
import { EventImporter } from "./EventImporter";
import { useEditorLeaveGuard } from "../app/NavigationGuard";
export function EventEditor({
  songsRepo,
  eventsRepo,
  initial,
  onSaved,
  onCancel,
}: {
  songsRepo: AdminRepository;
  eventsRepo: EventRepository;
  initial: ArchiveEvent | null;
  onSaved: (event: ArchiveEvent) => void;
  onCancel: () => void;
}) {
  const [id] = useState(() => initial?.id ?? crypto.randomUUID()),
    [date, setDate] = useState(initial?.date ?? ""),
    [selected, setSelected] = useState<EventSong[]>(initial?.songs ?? []),
    [catalog, setCatalog] = useState<AdminSong[]>([]),
    [kind, setKind] = useState<SongKind>("lyrics"),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loadError, setLoadError] = useState(false),
    [retry, setRetry] = useState(0),
    [showImport, setShowImport] = useState(false),
    [pending, setPending] = useState(0),
    [importBusy, setImportBusy] = useState(false);
  const dirty =
    date !== (initial?.date ?? "") ||
    pending > 0 ||
    JSON.stringify(selected.map((song) => song.id)) !==
      JSON.stringify(initial?.songs.map((song) => song.id) ?? []);
  const requestLeave = useEditorLeaveGuard(dirty, busy || importBusy);
  const importedSongs = useRef(new Map<string, AdminSong>());
  useEffect(() => {
    let active = true;
    setLoadError(false);
    songsRepo
      .listAdmin()
      .then((rows) => {
        if (active) {
          const merged = new Map(
            rows.filter((s) => s.status === "published").map((s) => [s.id, s]),
          );
          importedSongs.current.forEach((song, id) => merged.set(id, song));
          setCatalog([...merged.values()]);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [songsRepo, retry]);
  function add(song: EventSong) {
    const matches = (other: EventSong) =>
      other.kind !== song.kind &&
      songTitleKey(other.title) === songTitleKey(song.title);
    const counterpart = [...catalog, ...importedSongs.current.values()].find(
      (other) => other.status === "published" && matches(other),
    );
    setSelected((current) => {
      const additions = [song];
      if (counterpart && !current.some(matches)) additions.push(counterpart);
      return [
        ...current,
        ...additions
          .filter((next) => !current.some((old) => old.id === next.id))
          .map((next) => ({
            id: next.id,
            title: next.title,
            artist: next.artist,
            kind: next.kind,
            content: next.content,
          })),
      ];
    });
  }
  function imported(song: AdminSong) {
    importedSongs.current.set(song.id, song);
    setCatalog((current) => [
      ...current.filter((old) => old.id !== song.id),
      song,
    ]);
    add(song);
  }
  function move(song: EventSong, delta: number) {
    setSelected((current) => moveEventSong(current, song.id, delta));
  }
  async function save(status: SongStatus) {
    if (busy || pending) return;
    const input = {
      id,
      title: "Cora",
      date,
      status,
      songIds: selected.map((song) => song.id),
    };
    const invalid = validateEvent(input);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      onSaved(await eventsRepo.save(input));
    } catch (cause) {
      setError((cause as Error).message || "Não foi possível salvar o evento.");
    } finally {
      setBusy(false);
    }
  }
  const available = filterSongs(catalog, { kind, search }).filter(
    (song) => !selected.some((item) => item.id === song.id),
  );
  return (
    <section className="event-editor" aria-label="Organizar visita">
      <div className="section-heading">
        <h2>{initial ? "Editar evento" : "Organizar visita"}</h2>
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            if (requestLeave()) onCancel();
          }}
        >
          Voltar aos eventos
        </button>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="event-metadata">
        <label>
          Data
          <input
            aria-label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </fieldset>
      <div className="event-editor-grid">
        <section aria-label="Escolher músicas do acervo">
          <h3>Escolher do acervo</h3>
          <p className="catalog-hint">
            Letras e cifras com o mesmo título entram juntas. Você pode retirar
            cada uma separadamente.
          </p>
          <div className="event-controls">
            <label>
              Tipo de música
              <select
                aria-label="Tipo de música"
                value={kind}
                disabled={busy}
                onChange={(e) => setKind(e.target.value as SongKind)}
              >
                <option value="lyrics">Letras</option>
                <option value="chords">Cifras</option>
              </select>
            </label>
            <label>
              Buscar no acervo
              <input
                type="search"
                value={search}
                disabled={busy}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {loadError ? (
            <div className="error-box" role="alert">
              Não foi possível carregar as músicas.{" "}
              <button
                className="text-button"
                onClick={() => setRetry((n) => n + 1)}
              >
                Tentar carregar músicas
              </button>
            </div>
          ) : available.length ? (
            <ul className="event-choices">
              {available.map((song) => (
                <li key={song.id}>
                  <span>{song.title}</span>
                  <button
                    className="button secondary"
                    disabled={busy}
                    aria-label={`Adicionar ${kind === "lyrics" ? "letra" : "cifra"} de ${song.title}`}
                    onClick={() => add(song)}
                  >
                    Adicionar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="catalog-hint">
              Nenhuma música disponível nesta busca.
            </p>
          )}
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => setShowImport((value) => !value)}
          >
            {showImport ? "Recolher importação" : "Adicionar músicas novas"}
          </button>
        </section>
        <section aria-label="Músicas do evento">
          <h3>Músicas do evento</h3>
          <p className="catalog-hint">
            A ordem das músicas em comum acompanha as duas listas.
          </p>
          {(["lyrics", "chords"] as const).map((type) => {
            const group = selected.filter((song) => song.kind === type),
              label = type === "lyrics" ? "letra" : "cifra";
            return (
              <section key={type}>
                <h4>
                  {type === "lyrics" ? "Letras" : "Cifras"} ({group.length})
                </h4>
                {group.length ? (
                  <ol className="event-selection">
                    {group.map((song, index) => (
                      <li key={song.id}>
                        <details>
                          <summary>{song.title}</summary>
                          <pre className={type === "chords" ? "mono" : ""}>
                            {song.content}
                          </pre>
                        </details>
                        <div className="record-actions">
                          <button
                            className="icon-button"
                            aria-label={`Subir ${label} ${song.title}`}
                            disabled={busy || index === 0}
                            onClick={() => move(song, -1)}
                          >
                            ↑
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Descer ${label} ${song.title}`}
                            disabled={busy || index === group.length - 1}
                            onClick={() => move(song, 1)}
                          >
                            ↓
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Retirar ${label} ${song.title}`}
                            disabled={busy}
                            onClick={() =>
                              setSelected((current) =>
                                current.filter((item) => item.id !== song.id),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="catalog-hint">Nenhuma {label} adicionada.</p>
                )}
              </section>
            );
          })}
          <p className="catalog-hint">
            Os textos deste evento serão preservados mesmo após alterações no
            acervo.
          </p>
        </section>
      </div>
      <fieldset
        className="event-import-container"
        hidden={!showImport}
        disabled={busy}
      >
        <EventImporter
          repo={songsRepo}
          catalog={catalog}
          onAdded={imported}
          onPendingChange={setPending}
          onBusyChange={setImportBusy}
        />
      </fieldset>
      {pending > 0 && (
        <p role="status" className="warning">
          Finalize ou remova as {pending} músicas da importação antes de salvar
          o evento.
        </p>
      )}
      <div className="form-actions">
        <button
          className="button secondary"
          disabled={busy || pending > 0}
          onClick={() => void save("draft")}
        >
          Salvar rascunho
        </button>
        <button
          className="button primary"
          disabled={busy || pending > 0}
          onClick={() => void save("published")}
        >
          {busy ? "Salvando…" : "Publicar evento"}
        </button>
      </div>
    </section>
  );
}
