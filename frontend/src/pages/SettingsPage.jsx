import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(
    () => user?.profile?.display_name || "",
  );
  const [bio, setBio] = useState(() => user?.profile?.bio || "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.display_name || "");
      setBio(user.profile.bio || "");
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api.patch("/api/users/me/", {
        profile: { display_name: displayName, bio },
      });
      setMsg("Perfil atualizado.");
      await refreshUser();
    } catch {
      setErr("Falha ao salvar perfil.");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api.post("/api/users/me/password/", {
        current_password: curPwd,
        new_password: newPwd,
      });
      setMsg("Senha alterada.");
      setCurPwd("");
      setNewPwd("");
    } catch {
      setErr("Senha atual incorreta ou nova senha inválida.");
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setMsg("");
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/api/users/me/avatar/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("Foto atualizada.");
      await refreshUser();
    } catch {
      setErr("Falha no upload da foto.");
    }
    e.target.value = "";
  };

  return (
    <Layout>
      <div className="container">
        <h1>Configurações</h1>
        <p className="muted">
          Todos os campos são opcionais: altere só o que quiser.
        </p>
        {msg ? <p style={{ color: "var(--accent)" }}>{msg}</p> : null}
        {err ? <p className="error">{err}</p> : null}

        <form className="card" onSubmit={saveProfile}>
          <h2>Perfil</h2>
          <label>
            <div className="muted">Nome exibido</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ display: "block", marginTop: "0.75rem" }}>
            <div className="muted">Bio</div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
            Salvar perfil
          </button>
        </form>

        <div className="card" style={{ marginTop: "1rem" }}>
          <h2>Foto de perfil</h2>
          <input type="file" accept="image/*" onChange={uploadAvatar} />
        </div>

        <form className="card" style={{ marginTop: "1rem" }} onSubmit={savePassword}>
          <h2>Alterar senha</h2>
          <label>
            <div className="muted">Senha atual</div>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label style={{ display: "block", marginTop: "0.75rem" }}>
            <div className="muted">Nova senha</div>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              minLength={8}
              style={{ width: "100%" }}
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
            Atualizar senha
          </button>
        </form>
      </div>
    </Layout>
  );
}
