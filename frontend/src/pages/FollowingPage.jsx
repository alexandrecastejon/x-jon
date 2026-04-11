import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function FollowingPage() {
  const { username } = useParams();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api
      .get(`/api/users/${username}/following/`)
      .then((r) => setUsers(r.data.results ?? r.data))
      .catch(() => setUsers([]));
  }, [username]);

  return (
    <Layout>
      <div className="container">
        <h1>
          Seguindo — <Link to={`/u/${username}`}>@{username}</Link>
        </h1>
        {users.length === 0 ? (
          <p className="muted">Não segue ninguém ainda.</p>
        ) : null}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((u) => (
            <li key={u.id} className="card">
              <Link to={`/u/${u.username}`}>
                <strong>{u.profile?.display_name || u.username}</strong>
              </Link>
              <span className="muted"> @{u.username}</span>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
