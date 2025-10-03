import { useEffect, useRef, useState } from "react";
import VideoPlayerControls from "./VideoPlayerControls.js";
import styles from "./CSS/Videoplayer.module.css";

interface VideoplayerProps {
  videoSrc: string;
  style?: React.CSSProperties;
}

export default function Videoplayer({ videoSrc }: VideoplayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<any>(null);
  const [framesProcessed, setFramesProcessed] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const wasm = await import("../pkg/rust_wasm.js");
        await wasm.default();

        if (videoRef.current) {
          // @ts-ignore
          const VideoProcessor = wasm.VideoProcessor;
          // Store processor instance in ref
          processorRef.current = new VideoProcessor("video-element");
          // Add timeupdate event listener to video
          videoRef.current.addEventListener("timeupdate", () => {
            if (processorRef.current) {
              processorRef.current.process_frame();
              setFramesProcessed(processorRef.current.get_frames_processed());
            }
          });
        }
      } catch (err) {
        console.error("Failed to initialize wasm module:", err);
      }
    })();
  }, []);

  return (
    <div ref={containerRef} className={styles.videoContainer}>
      <video
        id="video-element"
        ref={videoRef}
        src={videoSrc}
        preload="metadata"
        className={styles.videoElement}
      />
      <VideoPlayerControls videoRef={videoRef} containerRef={containerRef} />
    </div>
  );
}
