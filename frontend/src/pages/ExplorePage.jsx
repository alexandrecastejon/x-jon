import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

function toApiPath(nextUrl) {
  if (!nextUrl) return null;
  try {
    const parsed = new URL(nextUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return nextUrl;
  }
}

function displayName(user) {
  return user?.profile?.display_name?.trim() || user?.username;
}

function ExploreUserRow({ u, onToggleFollow }) {
  return (
    <li className="card">
      <div className="row">
        {u.profile?.avatar ? (
          <img
            src={u.profile.avatar}
            alt=""
            className="avatar"
            width={40}
            height={40}
          />
        ) : (
          <div className="avatar" aria-hidden />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/u/${u.username}`}>
            <strong>{displayName(u)}</strong>
          </Link>
          <span className="muted"> @{u.username}</span>
          {u.profile?.bio ? (
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              {u.profile.bio}
            </p>
          ) : null}
          <div style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className={
                u.is_following ? "btn btn-ghost" : "btn btn-primary"
              }
              onClick={() => onToggleFollow(u.username, u.is_following)}
            >
              {u.is_following ? "Deixar de seguir" : "Seguir"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsNext, setSuggestionsNext] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const runSearch = useCallback(async (term, append) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setNextUrl(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/users/search/", {
        params: { q: trimmed },
      });
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      setNextUrl(data.next);
    } catch {
      setError("Não foi possível buscar.");
      if (!append) setResults([]);
      setNextUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async (url, append) => {
    if (!append) setSuggestionsLoading(true);
    setError("");
    try {
      const path = url || "/api/users/search/";
      const { data } = await api.get(path);
      if (append) {
        setSuggestions((prev) => [...prev, ...data.results]);
      } else {
        setSuggestions(data.results);
      }
      setSuggestionsNext(data.next);
    } catch {
      setError("Não foi possível carregar sugestões.");
      if (!append) setSuggestions([]);
      setSuggestionsNext(null);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    loadSuggestions(null, false);
  }, [authLoading, user, loadSuggestions]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setNextUrl(null);
      setLoading(false);
      return;
    }
    const handle = setTimeout(() => {
      runSearch(q, false);
    }, 300);
    return () => clearTimeout(handle);
  }, [q, runSearch]);

  const loadMoreSearch = async () => {
    const path = toApiPath(nextUrl);
    if (!path) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(path);
      setResults((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
    } catch {
      setError("Falha ao carregar mais resultados.");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSuggestions = async () => {
    const path = toApiPath(suggestionsNext);
    if (!path) return;
    setSuggestionsLoading(true);
    setError("");
    try {
      const { data } = await api.get(path);
      setSuggestions((prev) => [...prev, ...data.results]);
      setSuggestionsNext(data.next);
    } catch {
      setError("Falha ao carregar mais sugestões.");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const toggleFollow = async (username, isFollowing) => {
    try {
      if (isFollowing) {
        await api.delete(`/api/users/${username}/follow/`);
      } else {
        await api.post(`/api/users/${username}/follow/`);
      }
      const nextFollowing = !isFollowing;
      const patch = (u) =>
        u.username === username ? { ...u, is_following: nextFollowing } : u;
      setResults((prev) => prev.map(patch));
      setSuggestions((prev) => prev.map(patch));
    } catch {
      setError("Não foi possível atualizar seguir/deixar de seguir.");
    }
  };

  return (
    <Layout>
      <div className="container">
        <h1>Explorar pessoas</h1>
        <p className="muted">
          Busque por nome de usuário, nome exibido ou trecho da bio. Abaixo
          aparecem todos os perfis disponíveis para seguir.
        </p>

        <label className="card" style={{ display: "block" }}>
          <div className="muted">Buscar</div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: ana, @usuario, café…"
            style={{ width: "100%", marginTop: "0.35rem" }}
            autoComplete="off"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {q.trim() ? (
          <>
            <h2 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
              Resultados da busca
            </h2>
            {loading && results.length === 0 ? (
              <p className="muted">Buscando…</p>
            ) : null}
            {!loading && results.length === 0 ? (
              <p className="muted">Nenhum utilizador encontrado.</p>
            ) : null}
            <ul style={{ listStyle: "none", padding: 0 }}>
              {results.map((u) => (
                <ExploreUserRow
                  key={`search-${u.id}`}
                  u={u}
                  onToggleFollow={toggleFollow}
                />
              ))}
            </ul>
            {nextUrl ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={loading}
                onClick={loadMoreSearch}
              >
                {loading ? "Carregando…" : "Carregar mais (busca)"}
              </button>
            ) : null}
          </>
        ) : null}

        <h2 style={{ marginTop: "1.75rem", marginBottom: "0.5rem" }}>
          Perfis sugeridos
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Todos os utilizadores registados (exceto você). Use os botões para
          seguir ou deixar de seguir.
        </p>
        {suggestionsLoading && suggestions.length === 0 ? (
          <p className="muted">Carregando perfis…</p>
        ) : null}
        {!suggestionsLoading && suggestions.length === 0 ? (
          <p className="muted">Ainda não há outros utilizadores.</p>
        ) : null}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {suggestions.map((u) => (
            <ExploreUserRow
              key={`sugg-${u.id}`}
              u={u}
              onToggleFollow={toggleFollow}
            />
          ))}
        </ul>
        {suggestionsNext ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={suggestionsLoading}
            onClick={loadMoreSuggestions}
          >
            {suggestionsLoading ? "Carregando…" : "Carregar mais sugestões"}
          </button>
        ) : null}
      </div>
    </Layout>
  );
}
