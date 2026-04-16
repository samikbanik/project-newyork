import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { VideoSummary } from "../../app/types";

function formatDuration(duration?: number) {
  if (!duration) {
    return "Ready to watch";
  }

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function CataloguePage() {
  const { tokens, user } = useAuth();
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens?.access) {
      return;
    }

    api
      .videos(tokens.access)
      .then(setVideos)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load videos."),
      )
      .finally(() => setLoading(false));
  }, [tokens?.access]);

  const publishedCount = videos.filter((video) => !!video.published_at).length;

  return (
    <section className="catalogue">
      <div className="catalogue-hero">
        <div className="catalogue-hero__grid">
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2>Ready-only playback for the first milestone</h2>
            <p>
              Welcome back, {user?.display_name}. This view stays deliberately lean until search,
              genres, and watch-history land in later phases.
            </p>
            <div className="hero-chip-row">
              <span className="chip chip--accent">Stream-ready</span>
              <span className="chip">Private media storage</span>
              <span className="chip chip--highlight">HLS playback</span>
            </div>
          </div>

          <aside className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat__label">Ready videos</span>
              <strong>{videos.length}</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__label">Published</span>
              <strong>{publishedCount}</strong>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__label">Role</span>
              <strong>{user?.role === "admin" ? "Admin" : "Viewer"}</strong>
            </div>
          </aside>
        </div>
      </div>

      {loading ? <div className="page-state">Loading the catalogue...</div> : null}
      {error ? <div className="page-state error">{error}</div> : null}

      {!loading && !error ? (
        <div className="catalogue-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Available now</p>
              <h3>Phase 1 library</h3>
            </div>
            <span className="section-meta">{videos.length} titles ready for playback</span>
          </div>

          <div className="video-grid">
            {videos.map((video) => (
              <article className="video-card" key={video.id}>
                <div className="video-card__visual">
                  {video.thumbnail_url ? (
                    <img alt={video.title} src={video.thumbnail_url} />
                  ) : (
                    <div className="video-card__placeholder">{video.title.slice(0, 1)}</div>
                  )}
                  <div className="video-card__overlay">
                    <span className="status-badge status-badge--success">Ready</span>
                    <span className="duration-pill">{formatDuration(video.duration_secs)}</span>
                  </div>
                </div>
                <div className="video-card__body">
                  <div className="video-card__meta">
                    <span>{video.content_rating}</span>
                    <span>{video.release_year}</span>
                    <span>{video.published_at ? "Published" : "Draft"}</span>
                  </div>
                  <h3>{video.title}</h3>
                  <p>{video.description || "Phase 1 catalogue card without discovery extras."}</p>
                  <div className="video-card__actions">
                    <Link className="primary-button" to={`/watch/${video.id}`}>
                      Watch now
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!videos.length ? (
            <div className="page-state">
              No ready videos yet. Upload one from the admin area to test the end-to-end path.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
