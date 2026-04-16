import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  manifestUrl: string;
  posterUrl?: string;
  title: string;
}

function hlsErrorMessage() {
  return "The stream could not be loaded. Please refresh the playback URL and try again.";
}

export function VideoPlayer({ manifestUrl, posterUrl, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    let hls: Hls | null = null;
    setReady(false);
    setError(null);

    const handleCanPlay = () => setReady(true);
    const handleNativeError = () => setError(hlsErrorMessage());

    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("error", handleNativeError);

    if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = manifestUrl;
      videoElement.load();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500_000,
        lowLatencyMode: false,
        enableWorker: true,
      });
      hls.loadSource(manifestUrl);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setError(null);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(hlsErrorMessage());
          setReady(false);
        }
      });
    } else {
      setError("This browser cannot play HLS streams.");
    }

    return () => {
      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
      videoElement.removeEventListener("canplay", handleCanPlay);
      videoElement.removeEventListener("error", handleNativeError);
      hls?.destroy();
    };
  }, [manifestUrl]);

  return (
    <div className="player-frame">
      {!ready && !error ? (
        <div className="player-overlay">
          <span className="info-chip">Preparing stream</span>
          <p>Loading the signed HLS manifest for {title}.</p>
        </div>
      ) : null}

      {error ? (
        <div className="player-overlay error-state">
          <span className="info-chip">Playback blocked</span>
          <p>{error}</p>
        </div>
      ) : null}

      <video className="video-element" controls playsInline poster={posterUrl || undefined} ref={videoRef} />
    </div>
  );
}
