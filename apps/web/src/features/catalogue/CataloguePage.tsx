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

  return (
    <section className="catalogue">
      <div className="catalogue-hero">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Ready-only playback for the first milestone</h2>
          <p>
            Welcome back, {user?.display_name}. This view stays deliberately lean until search,
            genres, and watch-history land in later phases.
          </p>
        </div>
      </div>

      {loading ? <div className="page-state">Loading the catalogue...</div> : null}
      {error ? <div className="page-state error">{error}</div> : null}

      {!loading && !error ? (
        <div className="video-grid">
          {videos.map((video) => (
            <article className="video-card" key={video.id}>
              <div className="video-card__visual">
                {video.thumbnail_url ? (
                  <img alt={video.title} src={video.thumbnail_url} />
                ) : (
                  <div className="video-card__placeholder">{video.title.slice(0, 1)}</div>
                )}
              </div>
              <div className="video-card__body">
                <div className="video-card__meta">
                  <span>{video.content_rating}</span>
                  <span>{video.release_year}</span>
                  <span>{formatDuration(video.duration_secs)}</span>
                </div>
                <h3>{video.title}</h3>
                <p>{video.description || "Phase 1 catalogue card without discovery extras."}</p>
                <Link className="primary-button" to={`/watch/${video.id}`}>
                  Watch now
                </Link>
              </div>
            </article>
          ))}
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

