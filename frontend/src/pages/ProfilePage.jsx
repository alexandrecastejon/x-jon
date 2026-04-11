import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/users/${username}/`);
      setProfile(data);
    } catch {
      setError("Usuário não encontrado.");
      setProfile(null);
    }
  }, [username]);

  const loadPosts = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/users/${username}/posts/`);
      setPosts(data.results ?? data);
    } catch {
      setPosts([]);
    }
  }, [username]);

  useEffect(() => {
    setError("");
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  const toggleFollow = async () => {
    if (!me || !profile) return;
    try {
      if (profile.is_following) {
        await api.delete(`/api/users/${username}/follow/`);
      } else {
        await api.post(`/api/users/${username}/follow/`);
      }
      await loadProfile();
    } catch {
      setError("Não foi possível atualizar seguir/deixar de seguir.");
    }
  };

  const openEdit = (post) => {
    setEditing(post);
    setEditText(post.content);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.patch(`/api/posts/${editing.id}/`, {
        content: editText.trim(),
      });
      setEditing(null);
      await loadPosts();
    } catch {
      setError("Falha ao salvar edição.");
    }
  };

  const isMe = me && profile && me.username === profile.username;

  return (
    <Layout>
      <div className="container">
        {error && !profile ? <p className="error">{error}</p> : null}
        {profile ? (
          <>
            <div className="card">
              <h1 style={{ margin: "0 0 0.25rem" }}>
                {profile.profile?.display_name || profile.username}
              </h1>
              <p className="muted" style={{ margin: 0 }}>
                @{profile.username}
              </p>
              {profile.profile?.bio ? <p>{profile.profile.bio}</p> : null}
              <p className="muted">
                <Link to={`/u/${profile.username}/followers`}>
                  {profile.followers_count} seguidores
                </Link>
                {" · "}
                <Link to={`/u/${profile.username}/following`}>
                  {profile.following_count} seguindo
                </Link>
                {" · "}
                {profile.posts_count} posts
              </p>
              {me && !isMe ? (
                <button
                  type="button"
                  className={
                    profile.is_following ? "btn btn-ghost" : "btn btn-primary"
                  }
                  onClick={toggleFollow}
                >
                  {profile.is_following ? "Deixar de seguir" : "Seguir"}
                </button>
              ) : null}
              {isMe ? (
                <p className="muted">
                  Seus posts aparecem aqui. O feed principal só mostra quem você
                  segue.
                </p>
              ) : null}
            </div>

            <h2>Postagens</h2>
            {posts.length === 0 ? (
              <p className="muted">Nenhuma postagem ainda.</p>
            ) : null}
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUsername={me?.username}
                onEdit={isMe ? openEdit : undefined}
              />
            ))}
          </>
        ) : null}

        {editing ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <form className="card" style={{ width: "100%", maxWidth: 480 }} onSubmit={saveEdit}>
              <h3>Editar post</h3>
              <textarea
                rows={4}
                maxLength={280}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{ width: "100%" }}
              />
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
