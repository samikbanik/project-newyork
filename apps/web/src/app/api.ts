import type {
  AuthResponse,
  AuthTokens,
  PlaybackPayload,
  VideoDetail,
  VideoSummary,
} from "./types";
import { clearStoredAuth, readStoredAuth, updateStoredAccess } from "./auth-storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const REFRESH_PATH = "/auth/token/refresh/";

let refreshInFlight: Promise<string | null> | null = null;

async function sendRequest(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function refreshAccessToken() {
  const storedAuth = readStoredAuth();
  if (!storedAuth?.refresh) {
    clearStoredAuth();
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await sendRequest(REFRESH_PATH, {
        method: "POST",
        body: JSON.stringify({ refresh: storedAuth.refresh }),
      });

      if (!response.ok) {
        clearStoredAuth();
        return null;
      }

      const payload = (await response.json()) as Pick<AuthTokens, "access">;
      updateStoredAccess(payload.access);
      return payload.access;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  retryOnAuthFailure = true,
): Promise<T> {
  const effectiveAccessToken = readStoredAuth()?.access ?? accessToken;
  const response = await sendRequest(path, options, effectiveAccessToken);

  if (
    response.status === 401 &&
    retryOnAuthFailure &&
    path !== REFRESH_PATH &&
    !!readStoredAuth()?.refresh
  ) {
    const refreshedAccess = await refreshAccessToken();
    if (refreshedAccess) {
      return request<T>(path, options, refreshedAccess, false);
    }
  }

  if (response.status === 401 && path !== REFRESH_PATH) {
    clearStoredAuth();
  }

  return parseResponse<T>(response);
}

export const api = {
  register(payload: {
    email: string;
    display_name: string;
    password: string;
  }) {
    return request<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  refresh(tokens: Pick<AuthTokens, "refresh">) {
    return sendRequest(REFRESH_PATH, {
      method: "POST",
      body: JSON.stringify(tokens),
    }).then((response) => parseResponse<Pick<AuthTokens, "access">>(response));
  },
  logout(refresh: string, accessToken: string) {
    return request<void>(
      "/auth/logout/",
      {
        method: "POST",
        body: JSON.stringify({ refresh }),
      },
      accessToken,
    );
  },
  session(accessToken: string) {
    return request<AuthResponse>("/auth/session/", { method: "GET" }, accessToken);
  },
  videos(accessToken: string) {
    return request<VideoSummary[]>("/videos/", { method: "GET" }, accessToken);
  },
  video(videoId: string, accessToken: string) {
    return request<VideoDetail>(`/videos/${videoId}/`, { method: "GET" }, accessToken);
  },
  playbackUrl(videoId: string, accessToken: string) {
    return request<PlaybackPayload>(
      `/videos/${videoId}/playback-url/`,
      { method: "GET" },
      accessToken,
    );
  },
  initiateUpload(
    payload: {
      title: string;
      description: string;
      content_rating: string;
      release_year: number;
      filename: string;
      file_size_bytes: number;
      part_count: number;
    },
    accessToken: string,
  ) {
    return request<{
      video_id: string;
      upload_id: string;
      presigned_parts: Array<{ part_number: number; upload_url: string }>;
      part_size_bytes: number;
    }>(
      "/admin/videos/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  },
  completeUpload(
    videoId: string,
    payload: {
      upload_id: string;
      parts: Array<{ part_number: number; etag: string }>;
    },
    accessToken: string,
  ) {
    return request<{ message: string; job_id: string }>(
      `/admin/videos/${videoId}/complete-upload/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  },
};
