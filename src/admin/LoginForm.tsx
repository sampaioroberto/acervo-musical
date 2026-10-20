import { useState, type FormEvent } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import type { AuthPort } from "../backend/auth";
export function LoginForm({
  auth,
  onSignedIn,
}: {
  auth: AuthPort;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.signIn(email, password);
      onSignedIn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  return (
    <div className="login-layout">
      <div>
        <h1>Louvores <em>Cora</em></h1>
        <a className="text-button back-link" href="#/">
          ← Voltar ao acervo
        </a>
      </div>
      <form className="login-card" onSubmit={submit}>
        <span className="login-lock">
          <LockKeyhole size={23} />
        </span>
        <h2>Entrar na administração</h2>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
          <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}
