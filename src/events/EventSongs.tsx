import { useState } from "react";
import type { EventSong } from "./types";
export function EventSongs({
  songs,
  label,
  onCompose,
}: {
  songs: EventSong[];
  label: "Letras" | "Cifras";
  onCompose: (songs: EventSong[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const singular = label === "Letras" ? "letra" : "cifra";
  return (
    <section className="event-song-group" aria-label={label + " do evento"}>
      <div className="section-heading">
        <h2>{label}</h2>
        <button
          className="button primary"
          disabled={!songs.length}
          onClick={() => onCompose(songs)}
        >
          PDF das {label.toLowerCase()}
        </button>
      </div>
      {!songs.length ? (
        <p className="catalog-hint">Nenhuma {singular} neste evento.</p>
      ) : (
        <div className="song-list">
          {songs.map((song, index) => (
            <article className="song-card" key={song.id}>
              <div className="song-row">
                <span className="song-number">{index + 1}</span>
                <button
                  className="song-title-button"
                  aria-expanded={expanded === song.id}
                  aria-label={`${expanded === song.id ? "Ocultar" : "Visualizar"} ${singular} de ${song.title}`}
                  onClick={() =>
                    setExpanded(expanded === song.id ? null : song.id)
                  }
                >
                  <h3>{song.title}</h3>
                  <span className="read-song">
                    {expanded === song.id ? "Ocultar" : "Visualizar"} {singular}
                  </span>
                </button>
                <button
                  className="button secondary event-single-pdf"
                  aria-label={`PDF da ${singular} ${song.title}`}
                  onClick={() => onCompose([song])}
                >
                  PDF
                </button>
              </div>
              {expanded === song.id && (
                <pre
                  className={
                    "song-content " + (singular === "cifra" ? "mono" : "")
                  }
                >
                  {song.content}
                </pre>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
