import { useEffect, useRef, useState } from "react";
import styles from "./CSS/VideoPlayerControls.module.css";

export default function VideoPlayerControls({
  videoRef,
  containerRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Track play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRef]);

  // Track time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [videoRef]);

  // Track fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Add click-to-play on video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onVideoClick = () => {
      handlePlayPause();
    };

    video.addEventListener("click", onVideoClick);
    return () => video.removeEventListener("click", onVideoClick);
  }, [videoRef]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate time based on mouse position
  const getTimeFromPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return 0;

    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position)) * duration;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = getTimeFromPosition(e);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle mouse down on progress bar (start dragging)
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleProgressClick(e);
  };

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isSeeking) return;

    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      const progressBar = progressBarRef.current;
      if (!video || !progressBar) return;

      const rect = progressBar.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const newTime = Math.max(0, Math.min(1, position)) * duration;
      video.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsSeeking(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSeeking, duration, videoRef]);

  // Handle hover on progress bar
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = getTimeFromPosition(e);
    setHoverTime(time);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.videoControls}>
      <button className={styles.controlButton} onClick={handlePlayPause}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      
      <div
        ref={progressBarRef}
        className={styles.progressBar}
        onMouseDown={handleProgressMouseDown}
        onMouseMove={handleProgressMouseMove}
        onMouseLeave={handleProgressMouseLeave}
      >
        <div className={styles.progressFilled} style={{ width: `${progress}%` }}></div>
        {hoverTime !== null && (
          <div
            className={styles.progressTooltip}
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
      
      <span className={styles.timeDisplay}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      
      <button className={styles.controlButton} onClick={handleFullscreen}>
        ❐
      </button>
    </div>
  );
}