import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function PostPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([
        api.get(`/api/posts/${id}/`),
        api.get(`/api/posts/${id}/comments/`),
      ]);
      setPost(pr.data);
      setComments(cr.data.results ?? cr.data);
      setError("");
    } catch {
      setError("Post não encontrado.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async () => {
    if (!isAuthenticated) return;
    try {
      if (post.is_liked) {
        await api.delete(`/api/posts/${id}/like/`);
      } else {
        await api.post(`/api/posts/${id}/like/`);
      }
      const { data } = await api.get(`/api/posts/${id}/`);
      setPost(data);
    } catch {
      setError("Falha na curtida.");
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await api.post(`/api/posts/${id}/comments/`, { content: body.trim() });
      setBody("");
      const { data } = await api.get(`/api/posts/${id}/comments/`);
      setComments(data.results ?? data);
    } catch {
      setError("Falha ao comentar.");
    }
  };

  if (error && !post) return <Layout><div className="container"><p className="error">{error}</p></div></Layout>;

  return (
    <Layout>
      <div className="container">
        <Link to="/feed">← Voltar</Link>
        {post ? (
          <article className="card" style={{ marginTop: "1rem" }}>
            <div className="row">
              {post.author?.profile?.avatar ? (
                <img
                  src={post.author.profile.avatar}
                  alt=""
                  className="avatar"
                />
              ) : (
                <div className="avatar" />
              )}
              <div>
                <Link to={`/u/${post.author.username}`}>
                  <strong>
                    {post.author.profile?.display_name || post.author.username}
                  </strong>
                </Link>
                <span className="muted"> @{post.author.username}</span>
                <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
                <p className="muted">
                  {post.likes_count ?? 0} curtidas · {post.comments_count ?? comments.length}{" "}
                  comentários
                </p>
                {isAuthenticated ? (
                  <button
                    type="button"
                    className={post.is_liked ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={toggleLike}
                  >
                    {post.is_liked ? "Descurtir" : "Curtir"}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}

        <h2>Comentários</h2>
        {isAuthenticated ? (
          <form className="card" onSubmit={sendComment}>
            <textarea
              rows={2}
              maxLength={500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Comentar…"
              style={{ width: "100%" }}
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
              Enviar
            </button>
          </form>
        ) : (
          <p className="muted">
            <Link to="/login">Entre</Link> para comentar.
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="card">
            <Link to={`/u/${c.author.username}`}>
              <strong>{c.author.profile?.display_name || c.author.username}</strong>
            </Link>
            <span className="muted"> @{c.author.username}</span>
            <p style={{ margin: "0.35rem 0 0", whiteSpace: "pre-wrap" }}>
              {c.content}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
