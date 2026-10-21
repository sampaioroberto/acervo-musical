import { useEffect, useState } from "react";
import type { AdminRepository } from "../catalog/repository";
import type { ArchiveEvent, EventRepository, EventSummary } from "./types";
import { formatEventDate } from "./model";
import { EventEditor } from "./EventEditor";
export function EventAdmin({
  songsRepo,
  eventsRepo,
  onSignOut,
  signOutError,
}: {
  songsRepo: AdminRepository;
  eventsRepo: EventRepository;
  onSignOut: () => void;
  signOutError: string;
}) {
  const [events, setEvents] = useState<EventSummary[]>([]),
    [editing, setEditing] = useState<ArchiveEvent | null | undefined>(
      undefined,
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    eventsRepo
      .listAdmin()
      .then((rows) => {
        if (active) setEvents(rows);
      })
      .catch(() => {
        if (active)
          setError("Não foi possível carregar os eventos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventsRepo, revision]);
  async function edit(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const event = await eventsRepo.getAdmin(id);
      if (!event) throw Error("Este evento não está disponível.");
      setEditing(event);
    } catch {
      setError("Não foi possível abrir este evento. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(event: EventSummary) {
    if (
      busy ||
      !window.confirm(
        `Excluir o evento “${event.title}”? As músicas continuarão no acervo.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await eventsRepo.remove(event.id);
      setRevision((value) => value + 1);
    } catch {
      setError("Não foi possível excluir o evento. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page admin-page events-admin">
      <div className="admin-heading">
        <h1>Eventos</h1>
        <button className="button secondary" onClick={onSignOut}>
          Sair
        </button>
      </div>
      {signOutError && (
        <p className="error-box" role="alert">
          {signOutError}
        </p>
      )}
      {editing !== undefined ? (
        <EventEditor
          key={editing?.id ?? "new"}
          initial={editing}
          songsRepo={songsRepo}
          eventsRepo={eventsRepo}
          onCancel={() => setEditing(undefined)}
          onSaved={(event) => {
            setEditing(undefined);
            setNotice(
              event.status === "published"
                ? "Evento publicado."
                : "Rascunho do evento salvo.",
            );
            setRevision((value) => value + 1);
          }}
        />
      ) : (
        <>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => {
              setNotice("");
              setEditing(null);
            }}
          >
            Organizar visita
          </button>
          {notice && (
            <p className="success status" role="status">
              {notice}
            </p>
          )}
          {error && (
            <div className="error-box" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() => {
                  setError("");
                  setRevision((value) => value + 1);
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {loading ? (
            <p className="status">Carregando eventos…</p>
          ) : events.length ? (
            <div className="event-list">
              {events.map((event) => (
                <article className="event-card" key={event.id}>
                  <div>
                    <h2>{event.title}</h2>
                    <time dateTime={event.date}>
                      {formatEventDate(event.date)}
                    </time>
                    <span className={"publication-status " + event.status}>
                      {event.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <div className="form-actions">
                    {event.status === "published" && (
                      <a
                        className="button secondary"
                        href={"#/events/" + event.id}
                        aria-label={"Abrir " + event.title}
                      >
                        Ver evento
                      </a>
                    )}
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void edit(event.id)}
                      aria-label={"Editar evento " + event.title}
                    >
                      Editar
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => void remove(event)}
                      aria-label={"Excluir evento " + event.title}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">Nenhum evento cadastrado.</p>
          )}
        </>
      )}
    </main>
  );
}
