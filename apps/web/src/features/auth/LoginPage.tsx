import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../app/auth";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, display_name: displayName });
      }
      navigate(nextPath);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not sign you in.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="auth-hero__content">
          <p className="eyebrow">Small streaming platform</p>
          <h1>From upload to playback in one clean Phase 1 slice.</h1>
          <p>
            This first release focuses on secure sign-in, a ready-only catalogue, and direct
            HLS playback without the API serving video bytes.
          </p>
        </div>

        <div className="hero-chip-row">
          <span className="chip chip--accent">Dark-first system</span>
          <span className="chip">Ready-only catalogue</span>
          <span className="chip chip--highlight">Signed playback</span>
        </div>

        <div className="auth-feature-list">
          <article className="feature-card">
            <span className="feature-card__label">Security</span>
            <strong>JWT sessions with refresh handling</strong>
            <p>Stay signed in across refreshes without the app getting stuck on expired tokens.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__label">Pipeline</span>
            <strong>Admin upload to HLS playback</strong>
            <p>Ingest, transcode, and stream through signed manifests and private media storage.</p>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="segment-control" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Log in
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              <span className="field-label">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Jane Smith"
                required
              />
            </label>
          ) : null}

          <label>
            <span className="field-label">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
              required
              type="email"
            />
          </label>

          <label>
            <span className="field-label">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Working..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
