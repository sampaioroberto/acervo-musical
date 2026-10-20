import { useEffect, useReducer, useState } from "react";
import { Search, Plus, Check, Music2, BookOpen, Eye } from "lucide-react";
import type { CatalogRepository } from "./repository";
import type { Song, SongKind } from "./types";
import { changeSelection } from "./selection";
import { SelectionPanel } from "./SelectionPanel";
export function CatalogPage({
  repository,
  onCompose,
}: {
  repository: CatalogRepository;
  onCompose: (songs: Song[]) => void;
}) {
  const [selection, dispatch] = useReducer(changeSelection, {
    kind: "lyrics",
    ids: [],
    notice: null,
  });
  const [query, setQuery] = useState(""),
    [songs, setSongs] = useState<Song[]>([]),
    [cache, setCache] = useState<Record<string, Song>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading",
    ),
    [retry, setRetry] = useState(0),
    [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    repository
      .listPublished({ kind: selection.kind, search: query })
      .then((rows) => {
        if (!active) return;
        setSongs(rows);
        setCache((old) => ({
          ...old,
          ...Object.fromEntries(rows.map((s) => [s.id, s])),
        }));
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [repository, query, selection.kind, retry]);
  const switchKind = (kind: SongKind) => {
    const confirmed =
      selection.ids.length === 0 ||
      window.confirm("Trocar de tipo vai limpar sua seleção. Continuar?");
    dispatch({ type: "switch-kind", kind, confirmed });
    if (confirmed) setExpanded(null);
  };
  const selected = selection.ids
    .map((id) => cache[id])
    .filter((s): s is Song => !!s);
  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>
            Louvores <em>Cora</em>
          </h1>
          <p className="hero-copy">Letras e cifras para as visitas ao Cora.</p>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="paper paper-back" />
          <div className="paper paper-front">
            <Music2 size={34} strokeWidth={1.2} />
            <div className="paper-title" />
            <div className="paper-columns">
              <div />
              <div />
            </div>
            <span>LOUVORES CORA</span>
          </div>
          <span className="illustration-dot">♪</span>
        </div>
      </section>
      <div className="workspace">
        <section className="catalog" aria-label="Acervo de músicas">
          <div className="section-heading">
            <div>
              <h2>Músicas</h2>
              <p className="catalog-instruction">
                Selecione as músicas e gere o PDF.
              </p>
            </div>
            <span className="count-label">
              {status === "ready" ? songs.length : "—"}{" "}
              {songs.length === 1 ? "música" : "músicas"}
            </span>
          </div>
          <div className="catalog-controls">
            <div className="tabs" role="group" aria-label="Tipo de conteúdo">
              <button
                className={selection.kind === "lyrics" ? "active" : ""}
                aria-pressed={selection.kind === "lyrics"}
                onClick={() => switchKind("lyrics")}
              >
                <BookOpen size={16} />
                Letras
              </button>
              <button
                className={selection.kind === "chords" ? "active" : ""}
                aria-pressed={selection.kind === "chords"}
                onClick={() => switchKind("chords")}
              >
                <Music2 size={16} />
                Cifras
              </button>
            </div>
            <label className="search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar música ou artista"
                aria-label="Buscar música ou artista"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <p className="catalog-hint">
            {selection.kind === "lyrics"
              ? "Até 4 letras por folha A4, duas por coluna."
              : "Cada música começa em uma nova página."}
          </p>
          <div aria-live="polite">
            {status === "loading" && (
              <p className="empty">Carregando músicas…</p>
            )}
            {status === "error" && (
              <div className="empty">
                <p>Não foi possível carregar o acervo.</p>
                <button
                  className="button secondary"
                  onClick={() => setRetry((n) => n + 1)}
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {status === "ready" && songs.length === 0 && (
              <p className="empty">
                {query
                  ? "Nenhuma música encontrada."
                  : "Seu acervo ainda está vazio."}
              </p>
            )}
          </div>
          {status === "ready" && (
            <div className="song-list">
              {songs.map((song, i) => {
                const isSelected = selection.ids.includes(song.id);
                return (
                  <article
                    key={song.id}
                    className={"song-card " + (isSelected ? "is-selected" : "")}
                  >
                    <div className="song-row">
                      <div className="song-number">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <button
                        className="song-title-button"
                        aria-label={`${expanded === song.id ? "Ocultar" : "Visualizar"} ${song.kind === "lyrics" ? "letra" : "cifra"} de ${song.title}`}
                        onClick={() =>
                          setExpanded(expanded === song.id ? null : song.id)
                        }
                        aria-expanded={expanded === song.id}
                      >
                        <h3>{song.title}</h3>
                        {song.artist && <span>{song.artist}</span>}
                        <span className="read-song">
                          <Eye size={13} />
                          {expanded === song.id ? "Ocultar" : "Visualizar"}{" "}
                          {song.kind === "lyrics" ? "letra" : "cifra"}
                        </span>
                      </button>
                      <span className="type-pill">
                        {song.kind === "lyrics" ? "Letra" : "Cifra"}
                      </span>
                      <button
                        className={
                          "select-song " + (isSelected ? "selected" : "")
                        }
                        aria-label={
                          (isSelected ? "Remover " : "Selecionar ") + song.title
                        }
                        aria-pressed={isSelected}
                        onClick={() =>
                          dispatch({
                            type: isSelected ? "remove" : "add",
                            id: song.id,
                          })
                        }
                      >
                        {isSelected ? <Check size={19} /> : <Plus size={19} />}
                      </button>
                    </div>
                    {expanded === song.id && (
                      <pre
                        className={
                          "song-content " +
                          (song.kind === "chords" ? "mono" : "")
                        }
                      >
                        {song.content}
                      </pre>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <SelectionPanel
          songs={selected}
          notice={selection.notice}
          dispatch={dispatch}
          onCompose={onCompose}
        />
      </div>
    </main>
  );
}
