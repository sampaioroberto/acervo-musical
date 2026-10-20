import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Music2, ArrowUpRight } from "lucide-react";
import { CatalogPage } from "../catalog/CatalogPage";
import { createDemoRepository } from "../catalog/demoRepository";
import type { Song } from "../catalog/types";
import { readConfig } from "./config";
import { createBackend } from "../backend/client";
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
  const [route, setRoute] = useState(location.hash);
  const [composition, setComposition] = useState<Song[] | null>(null);
  const services = useMemo(() => {
    try {
      const config = readConfig({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
          .VITE_SUPABASE_PUBLISHABLE_KEY,
      });
      return config.mode === "supabase"
        ? { mode: "supabase" as const, ...createBackend(config) }
        : { mode: "demo" as const, repository: createDemoRepository() };
    } catch (error) {
      return { mode: "error" as const, message: (error as Error).message };
    }
  }, []);
  useEffect(() => {
    const update = () => {
      setRoute(location.hash);
      setComposition(null);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (services.mode === "error")
    return (
      <main className="page admin-page">
        <h1>Não foi possível abrir o acervo</h1>
        <p role="alert">{services.message}</p>
      </main>
    );
  const admin = route.startsWith("#/admin");
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
          <a className={!admin ? "current" : ""} href="#/">
            Acervo
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
            <AdminPage repo={services.repository} auth={services.auth} />
          ) : (
            <main className="page admin-page">
              <h1>Administração</h1>
              <p>A administração fica disponível após conectar o Supabase.</p>
              <a className="button secondary" href="#/">
                Voltar ao acervo
              </a>
            </main>
          )
        ) : (
          <CatalogPage
            repository={services.repository}
            onCompose={setComposition}
          />
        )}
        {composition && (
          <PdfComposer
            songs={composition}
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
