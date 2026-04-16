import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../../app/api";
import { useAuth } from "../../app/auth";
import type { PlaybackPayload, VideoDetail } from "../../app/types";
import { VideoPlayer } from "./VideoPlayer";

export function WatchPage() {
  const { tokens } = useAuth();
  const { videoId = "" } = useParams();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = tokens?.access;
    if (!accessToken || !videoId) {
      return;
    }
    const resolvedAccessToken: string = accessToken;

    async function load() {
      try {
        const [videoResponse, playbackResponse] = await Promise.all([
          api.video(videoId, resolvedAccessToken),
          api.playbackUrl(videoId, resolvedAccessToken),
        ]);
        setVideo(videoResponse);
        setPlayback(playbackResponse);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to start playback.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tokens?.access, videoId]);

  if (loading) {
    return <div className="page-state">Preparing playback...</div>;
  }

  if (error || !video || !playback) {
    return <div className="page-state error">{error ?? "Playback is unavailable."}</div>;
  }

  return (
    <section className="watch-layout">
      <div className="watch-layout__header">
        <p className="eyebrow">Now watching</p>
        <h2>{video.title}</h2>
        <p>{video.description || "No description provided for this title yet."}</p>
        <div className="watch-metadata">
          <span>{video.content_rating}</span>
          <span>{video.release_year}</span>
          <span>{video.available_qualities.join(", ") || "No renditions yet"}</span>
        </div>
      </div>
      <VideoPlayer manifestUrl={playback.manifest_url} title={video.title} />
    </section>
  );
}
