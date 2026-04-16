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
        <div className="topbar__brand">
          <div className="brand-mark" aria-hidden="true">
            PN
          </div>
          <div>
            <p className="eyebrow">StreamVault System</p>
            <h1>Project Newyork</h1>
          </div>
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
          <span className="status-badge status-badge--info">
            {user?.role === "admin" ? "Admin access" : "Viewer access"}
          </span>
          <button className="ghost-button" onClick={handleLogout} type="button">
            Log out
          </button>
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
