export type UserRole = "viewer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface VideoSummary {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_secs?: number;
  content_rating: string;
  release_year: number;
  published_at?: string;
}

export interface VideoDetail extends VideoSummary {
  available_qualities: string[];
}

export interface PlaybackPayload {
  session_id: string;
  manifest_url: string;
  expires_at: string;
  cookies: Record<string, string>;
}

