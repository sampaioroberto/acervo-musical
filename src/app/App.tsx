import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Music2, ArrowUpRight } from "lucide-react";
import { CatalogPage } from "../catalog/CatalogPage";
import { createDemoRepository } from "../catalog/demoRepository";
import type { PrintSong } from "../pdf/types";
import { createDemoEvents } from "../events/demo";
import { EventDetail, EventsPage, LatestEvent } from "../events/EventPages";
import "../events/events.css";
import { readConfig } from "./config";
import { createBackend } from "../backend/client";
import { NavigationProvider, useNavigationGuard } from "./NavigationGuard";
const PdfComposer = lazy(() =>
  import("../pdf/PdfComposer").then((module) => ({
    default: module.PdfComposer,
  })),
);
const AdminPage = lazy(() =>
  import("../admin/AdminPage").then((module) => ({
    default: module.AdminPage,
  })),
);
export function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}
function AppContent() {
  const { requestLeave } = useNavigationGuard();
  const [route, setRoute] = useState(location.hash);
  const [composition, setComposition] = useState<{
    songs: PrintSong[];
    fileName?: string;
  } | null>(null);
  const services = useMemo(() => {
    try {
      const config = readConfig({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
          .VITE_SUPABASE_PUBLISHABLE_KEY,
      });
      if (config.mode === "supabase")
        return { mode: "supabase" as const, ...createBackend(config) };
      const repository = createDemoRepository();
      return {
        mode: "demo" as const,
        repository,
        events: createDemoEvents(repository),
      };
    } catch (error) {
      return { mode: "error" as const, message: (error as Error).message };
    }
  }, []);
  useEffect(() => {
    const update = () => {
      if (location.hash !== route && !requestLeave()) {
        history.replaceState(
          null,
          "",
          location.pathname + location.search + route,
        );
        return;
      }
      setRoute(location.hash);
      setComposition(null);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [route, requestLeave]);
  if (services.mode === "error")
    return (
      <main className="page admin-page">
        <h1>Não foi possível abrir o acervo</h1>
        <p role="alert">{services.message}</p>
      </main>
    );
  const admin = route.startsWith("#/admin");
  const eventPage = route === "#/events" || route.startsWith("#/events/");
  const compose = (songs: PrintSong[], fileName?: string) =>
    setComposition({ songs, fileName });
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#/">
          <span className="brand-icon">
            <Music2 size={23} />
          </span>
          <span>
            Louvores <span className="brand-light">Cora</span>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a className={!admin && !eventPage ? "current" : ""} href="#/">
            Acervo
          </a>
          <a className={eventPage ? "current" : ""} href="#/events">
            Eventos
          </a>
          <a className="admin-link" href="#/admin">
            Administração
            <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      {services.mode === "demo" && (
        <div className="demo-banner">
          <span />
          Demonstração · Músicas de exemplo.
        </div>
      )}
      <Suspense
        fallback={
          <main className="page">
            <p className="status" role="status">
              Carregando…
            </p>
          </main>
        }
      >
        {admin ? (
          services.mode === "supabase" ? (
            <AdminPage
              repo={services.repository}
              auth={services.auth}
              events={services.events}
              eventMode={route.startsWith("#/admin/events")}
            />
          ) : (
            <main className="page admin-page">
              <h1>Administração</h1>
              <p>A administração fica disponível após conectar o Supabase.</p>
              <a className="button secondary" href="#/">
                Voltar ao acervo
              </a>
            </main>
          )
        ) : eventPage ? (
          route === "#/events" ? (
            <EventsPage repository={services.events} />
          ) : (
            <EventDetail
              repository={services.events}
              id={route.slice("#/events/".length)}
              onCompose={compose}
            />
          )
        ) : (
          <>
            <div className="page latest-event-container">
              <LatestEvent repository={services.events} />
            </div>
            <CatalogPage repository={services.repository} onCompose={compose} />
          </>
        )}
        {composition && (
          <PdfComposer
            songs={composition.songs}
            fileName={composition.fileName}
            onClose={() => setComposition(null)}
          />
        )}
      </Suspense>
      <footer className="site-footer">
        <span>
          <Music2 size={15} /> Louvores Cora
        </span>
      </footer>
    </>
  );
}
