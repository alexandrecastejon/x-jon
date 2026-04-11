import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  if (!user) return children;

  return (
    <>
      <header className="nav">
        <strong>x-jon</strong>
        <NavLink
          to="/feed"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Feed
        </NavLink>
        <NavLink
          to="/explorar"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Explorar
        </NavLink>
        <NavLink
          to={`/u/${user.username}`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Perfil
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Configurações
        </NavLink>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Sair
        </button>
      </header>
      {children}
    </>
  );
}
