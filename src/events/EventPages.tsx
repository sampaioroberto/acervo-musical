import { useEffect, useState } from "react";
import type {
  ArchiveEvent,
  EventSong,
  EventSummary,
  PublicEventRepository,
} from "./types";
import { formatEventDate } from "./model";
import { EventSongs } from "./EventSongs";
export function LatestEvent({
  repository,
}: {
  repository: PublicEventRepository;
}) {
  const [event, setEvent] = useState<EventSummary | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    repository
      .latestPublished()
      .then((value) => {
        if (active) setEvent(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [repository, retry]);
  if (error)
    return (
      <div className="latest-event event-load-error">
        <span>Não foi possível carregar o evento em destaque.</span>
        <button className="text-button" onClick={() => setRetry((n) => n + 1)}>
          Tentar carregar evento
        </button>
      </div>
    );
  return event ? (
    <section className="latest-event" aria-label="Evento mais recente">
      <div>
        <p className="eyebrow">EVENTO MAIS RECENTE</p>
        <a href={"#/events/" + event.id}>
          <h2>
            {event.title} · {formatEventDate(event.date)}
          </h2>
        </a>
      </div>
      <a className="button secondary" href={"#/events/" + event.id}>
        Ver letras e cifras
      </a>
    </section>
  ) : null;
}
export function EventsPage({
  repository,
}: {
  repository: PublicEventRepository;
}) {
  const [events, setEvents] = useState<EventSummary[]>([]),
    [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    repository
      .listPublished()
      .then((rows) => {
        if (active) {
          setEvents(rows);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [repository, retry]);
  return (
    <main className="page events-page">
      <h1>Eventos</h1>
      <p className="hero-copy">Letras e cifras de cada visita.</p>
      {status === "loading" ? (
        <p className="status">Carregando eventos…</p>
      ) : status === "error" ? (
        <div className="error-box" role="alert">
          Não foi possível carregar os eventos.
          <button
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : events.length ? (
        <div className="event-list">
          {events.map((event) => (
            <a
              className="event-card event-link"
              href={"#/events/" + event.id}
              key={event.id}
            >
              <h2>{event.title}</h2>
              <time dateTime={event.date}>{formatEventDate(event.date)}</time>
              <span>Ver letras e cifras →</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="empty">Nenhum evento publicado.</p>
      )}
    </main>
  );
}
export function EventDetail({
  repository,
  id,
  onCompose,
}: {
  repository: PublicEventRepository;
  id: string;
  onCompose: (songs: EventSong[], fileName?: string) => void;
}) {
  const [event, setEvent] = useState<ArchiveEvent | null>(null),
    [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    repository
      .getPublished(id)
      .then((value) => {
        if (active) {
          setEvent(value);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [repository, id, retry]);
  const compose = (songs: EventSong[]) => {
    if (event) {
      const title = event.title
        .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
        .slice(0, 120);
      onCompose(
        songs,
        `${title}-${event.date}-${songs[0]?.kind === "chords" ? "cifras" : "letras"}.pdf`,
      );
    }
  };
  return (
    <main className="page events-page">
      <a className="text-button" href="#/events">
        ← Todos os eventos
      </a>
      {status === "loading" ? (
        <p className="status">Carregando evento…</p>
      ) : status === "error" ? (
        <div className="error-box" role="alert">
          Não foi possível abrir o evento.
          <button
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : !event ? (
        <p className="empty">Evento não encontrado.</p>
      ) : (
        <>
          <header className="event-detail-heading">
            <h1>{event.title}</h1>
            <time dateTime={event.date}>{formatEventDate(event.date)}</time>
            <p>Consulte uma música ou baixe o PDF completo.</p>
          </header>
          <div className="event-public-grid">
            <EventSongs
              songs={event.songs.filter((song) => song.kind === "lyrics")}
              label="Letras"
              onCompose={compose}
            />
            <EventSongs
              songs={event.songs.filter((song) => song.kind === "chords")}
              label="Cifras"
              onCompose={compose}
            />
          </div>
        </>
      )}
    </main>
  );
}
