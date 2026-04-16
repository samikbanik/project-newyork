import type { AuthResponse } from "./types";

export const AUTH_STORAGE_KEY = "project-newyork-auth";
export const AUTH_STORAGE_EVENT = "project-newyork-auth-changed";

export function readStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuth(payload: AuthResponse | null) {
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export function updateStoredAccess(access: string) {
  const current = readStoredAuth();
  if (!current) {
    return null;
  }

  const next = { ...current, access };
  writeStoredAuth(next);
  return next;
}

export function clearStoredAuth() {
  writeStoredAuth(null);
}
