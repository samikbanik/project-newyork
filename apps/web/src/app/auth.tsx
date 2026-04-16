import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api";
import {
  AUTH_STORAGE_EVENT,
  clearStoredAuth,
  readStoredAuth,
  writeStoredAuth,
} from "./auth-storage";
import type { AuthResponse, AuthTokens, AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    display_name: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function stateFromPayload(payload: AuthResponse | null) {
  return {
    user: payload?.user ?? null,
    tokens: payload ? { access: payload.access, refresh: payload.refresh } : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncFromStorage = () => {
      const payload = readStoredAuth();
      const next = stateFromPayload(payload);
      if (cancelled) {
        return;
      }
      setUser(next.user);
      setTokens(next.tokens);
    };

    const bootstrap = async () => {
      const storedAuth = readStoredAuth();
      if (!storedAuth) {
        setLoading(false);
        return;
      }

      syncFromStorage();

      try {
        const refreshed = await api.refresh({ refresh: storedAuth.refresh });
        const session = await api.session(refreshed.access);
        if (cancelled) {
          return;
        }
        writeStoredAuth(session);
        syncFromStorage();
      } catch {
        clearStoredAuth();
        syncFromStorage();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    const handleStorage = () => syncFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_STORAGE_EVENT, handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_STORAGE_EVENT, handleStorage);
    };
  }, []);

  const applyAuth = (payload: AuthResponse) => {
    writeStoredAuth(payload);
    const next = stateFromPayload(payload);
    setUser(next.user);
    setTokens(next.tokens);
  };

  const value: AuthContextValue = {
    user,
    tokens,
    loading,
    login: async (payload) => {
      const response = await api.login(payload);
      applyAuth(response);
    },
    register: async (payload) => {
      const response = await api.register(payload);
      applyAuth(response);
    },
    logout: async () => {
      const storedAuth = readStoredAuth();
      try {
        if (storedAuth?.refresh) {
          await api.logout(storedAuth.refresh, storedAuth.access);
        }
      } finally {
        clearStoredAuth();
        setUser(null);
        setTokens(null);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
