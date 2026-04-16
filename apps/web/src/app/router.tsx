import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./auth";
import { AppShell } from "../components/AppShell";
import { AdminUploadPage } from "../features/admin/AdminUploadPage";
import { LoginPage } from "../features/auth/LoginPage";
import { CataloguePage } from "../features/catalogue/CataloguePage";
import { WatchPage } from "../features/player/WatchPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-state">Checking your session...</div>;
  }

  if (!user) {
    return <Navigate replace to={`/login?next=${encodeURIComponent(location.pathname)}`} />;
  }

  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <div className="page-state">This area is reserved for admin uploads.</div>;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <CataloguePage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/browse"
        element={
          <RequireAuth>
            <AppShell>
              <CataloguePage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/watch/:videoId"
        element={
          <RequireAuth>
            <AppShell>
              <WatchPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/upload"
        element={
          <RequireAuth>
            <AppShell>
              <RequireAdmin>
                <AdminUploadPage />
              </RequireAdmin>
            </AppShell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
