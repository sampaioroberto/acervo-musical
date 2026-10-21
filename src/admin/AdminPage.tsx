import { useEffect, useState } from "react";
import type { AdminRepository } from "../catalog/repository";
import type { AuthPort, Access, AuthChange } from "../backend/auth";
import { LoginForm } from "./LoginForm";
import { AdminWorkspace } from "./AdminWorkspace";
import "./admin.css";
import { EventAdmin } from "../events/EventAdmin";
import type { EventRepository } from "../events/types";
import { useNavigationGuard } from "../app/NavigationGuard";
export function AdminPage({
  repo,
  auth,
  events,
  eventMode = false,
}: {
  repo: AdminRepository;
  auth: AuthPort;
  events?: EventRepository;
  eventMode?: boolean;
}) {
  const { requestLeave } = useNavigationGuard();
  const [access, setAccess] = useState<Access | "checking" | "error">(
      "checking",
    ),
    [revision, setRevision] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      version = 0;
    const verify = (change?: AuthChange) => {
      const current = ++version;
      if (change?.identityChanged !== false) setAccess("checking");
      auth
        .current()
        .then((role) => {
          if (active && current === version) setAccess(role);
        })
        .catch(() => {
          if (active && current === version) setAccess("error");
        });
    };
    verify();
    const unsubscribe = auth.subscribe(verify);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, revision]);
  async function signOut() {
    if (!requestLeave()) return;
    setError("");
    try {
      await auth.signOut();
      setAccess("anonymous");
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }
  if (access === "admin")
    return (
      <>
        <nav className="admin-tabs" aria-label="Administração do site">
          <a href="#/admin" className={!eventMode ? "current" : ""}>
            Músicas
          </a>
          <a href="#/admin/events" className={eventMode ? "current" : ""}>
            Eventos
          </a>
        </nav>
        {eventMode && events ? (
          <EventAdmin
            songsRepo={repo}
            eventsRepo={events}
            onSignOut={() => void signOut()}
            signOutError={error}
          />
        ) : (
          <AdminWorkspace
            repo={repo}
            onSignOut={() => void signOut()}
            signOutError={error}
          />
        )}
      </>
    );
  return (
    <main className="page admin-page">
      {access === "anonymous" ? (
        <LoginForm auth={auth} onSignedIn={() => setRevision((n) => n + 1)} />
      ) : access === "checking" ? (
        <p className="status" role="status">
          Verificando acesso…
        </p>
      ) : (
        <div className="access-message">
          <p className="eyebrow">ADMINISTRAÇÃO</p>
          <h1>
            {access === "denied"
              ? "Acesso restrito"
              : "Não foi possível verificar o acesso"}
          </h1>
          <p role="alert">
            {access === "denied"
              ? "Esta conta não tem acesso à administração."
              : "Confira a conexão e tente novamente."}
          </p>
          <div className="form-actions">
            {access === "error" && (
              <button
                className="button secondary"
                onClick={() => setRevision((n) => n + 1)}
              >
                Tentar novamente
              </button>
            )}
            <button className="button secondary" onClick={() => void signOut()}>
              Sair desta conta
            </button>
            <a className="button secondary" href="#/">
              Voltar ao acervo
            </a>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
