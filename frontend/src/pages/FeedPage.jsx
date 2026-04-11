import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const toPath = (u) => {
    if (!u) return u;
    try {
      const parsed = new URL(u);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return u;
    }
  };

  const load = useCallback(async (url = "/api/posts/feed/") => {
    setLoading(true);
    const path = toPath(url) || url;
    try {
      const { data } = await api.get(path);
      setPosts((prev) =>
        path.includes("page=") ? [...prev, ...data.results] : data.results,
      );
      setNext(data.next);
    } catch {
      setError("Não foi possível carregar o feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("/api/posts/feed/");
  }, [load]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    try {
      await api.post("/api/posts/", { content: content.trim() });
      setContent("");
      await load("/api/posts/feed/");
    } catch {
      setError("Falha ao publicar.");
    }
  };

  return (
    <Layout>
      <div className="container">
        <h1>Feed</h1>
        <p className="muted">
          Apenas postagens de quem você segue (não inclui seus próprios posts).
        </p>

        <form className="card" onSubmit={createPost}>
          <label>
            <div className="muted">Nova postagem</div>
            <textarea
              rows={3}
              maxLength={280}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo?"
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>
          <div style={{ marginTop: "0.5rem" }}>
            <span className="muted">{content.length}/280</span>{" "}
            <button type="submit" className="btn btn-primary">
              Publicar
            </button>
          </div>
        </form>

        {error ? <p className="error">{error}</p> : null}
        {loading && posts.length === 0 ? (
          <p className="muted">Carregando…</p>
        ) : null}
        {!loading && posts.length === 0 ? (
          <p className="muted">
            Nada por aqui. Siga pessoas e veja as postagens delas no feed.
          </p>
        ) : null}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} currentUsername={user?.username} />
        ))}

        {next ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => load(next)}
          >
            Carregar mais
          </button>
        ) : null}
      </div>
    </Layout>
  );
}
