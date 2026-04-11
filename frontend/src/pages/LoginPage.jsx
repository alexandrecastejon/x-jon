import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) nav("/feed", { replace: true });
  }, [isAuthenticated, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      nav("/feed", { replace: true });
    } catch {
      setError("Usuário ou senha inválidos.");
    }
  };

  return (
    <div className="container">
      <h1>Entrar — x-jon</h1>
      <form className="card" onSubmit={submit} style={{ maxWidth: 360 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <div className="muted">Usuário</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <div className="muted">Senha</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
