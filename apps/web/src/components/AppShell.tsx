import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Phase 1 Streaming MVP</p>
          <h1>Project Newyork</h1>
        </div>
        <nav className="topnav">
          <Link className={location.pathname.startsWith("/watch") ? "" : "active"} to="/browse">
            Browse
          </Link>
          {user?.role === "admin" ? (
            <Link className={location.pathname.startsWith("/admin") ? "active" : ""} to="/admin/upload">
              Admin Upload
            </Link>
          ) : null}
          <button className="ghost-button" onClick={handleLogout} type="button">
            Log out
          </button>
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
