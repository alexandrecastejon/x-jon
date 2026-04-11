import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) nav("/feed", { replace: true });
  }, [isAuthenticated, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register({ username, email, password });
      nav("/feed", { replace: true });
    } catch (err) {
      const d = err.response?.data;
      setError(
        typeof d === "object"
          ? JSON.stringify(d)
          : "Não foi possível cadastrar.",
      );
    }
  };

  return (
    <div className="container">
      <h1>Cadastro — x-jon</h1>
      <form className="card" onSubmit={submit} style={{ maxWidth: 360 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <div className="muted">Usuário</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <div className="muted">E-mail</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            <div className="muted">Senha (mín. 8)</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn btn-primary">
          Criar conta
        </button>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
