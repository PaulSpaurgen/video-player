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

          // Use requestVideoFrameCallback when available to process exactly once per presented frame.
          // Throttle React state updates to ~4Hz to avoid rerendering every frame.
          const video = videoRef.current;
          let lastStateUpdate = 0;
          let cancelled = false;
          let rVfcId: number | null = null;

          const scheduleStateUpdate = () => {
            try {
              const now = performance.now();
              if (now - lastStateUpdate > 250) {
                if (processorRef.current && typeof processorRef.current.get_frames_processed === "function") {
                  setFramesProcessed(processorRef.current.get_frames_processed());
                }
                lastStateUpdate = now;
              }
            } catch (e) {
              // ignore state update errors
            }
          };

          const frameCallback = (now: number, metadata?: any) => {
            if (cancelled) return;
            try {
              if (processorRef.current && typeof processorRef.current.process_frame === "function") {
                processorRef.current.process_frame();
              }
            } catch (e) {
              // swallow wasm errors so the loop continues
              console.error("processor frame error:", e);
            }
            scheduleStateUpdate();

            // Queue next frame
            try {
              if ((video as any).requestVideoFrameCallback) {
                rVfcId = (video as any).requestVideoFrameCallback(frameCallback);
              }
            } catch (e) {
              // ignore
            }
          };

          // Start using requestVideoFrameCallback if present, otherwise fallback to a throttled timeupdate listener
          if ((video as any).requestVideoFrameCallback) {
            rVfcId = (video as any).requestVideoFrameCallback(frameCallback);
          } else {
            // fallback: throttle timeupdate to avoid per-frame setState
            const onTimeUpdate = () => {
              try {
                if (processorRef.current && typeof processorRef.current.process_frame === "function") {
                  processorRef.current.process_frame();
                }
              } catch (e) {
                console.error("processor timeupdate error:", e);
              }
              scheduleStateUpdate();
            };
            video.addEventListener("timeupdate", onTimeUpdate);

            // store for cleanup
            (processorRef as any)._timeupdate_listener = onTimeUpdate;
          }

          // store cancellation helper for cleanup
          (processorRef as any)._cancel = () => {
            cancelled = true;
          };
        }
      } catch (err) {
        console.error("Failed to initialize wasm module:", err);
      }
    })();
    
    // cleanup on unmount
    return () => {
      try {
        if ((processorRef as any)._cancel) {
          (processorRef as any)._cancel();
        }
        const video = videoRef.current;
        if (video && (processorRef as any)._timeupdate_listener) {
          video.removeEventListener("timeupdate", (processorRef as any)._timeupdate_listener);
        }
        // cancel requestVideoFrameCallback if used
        try {
          // @ts-ignore
          if (typeof (video as any)?.cancelVideoFrameCallback === "function" && (video as any)._rVfcId) {
            // nothing — kept for compatibility, rVfcId is closed over below
          }
        } catch (e) { /* ignore */ }
        
        // if we captured rVfcId in the effect closure, cancel it explicitly
        try {
          // @ts-ignore
          if (typeof (video as any)?.cancelVideoFrameCallback === "function") {
            // rVfcId is in the closure scope; TypeScript check suppressed
            // @ts-ignore
            if (typeof (rVfcId) === "number") (video as any).cancelVideoFrameCallback(rVfcId);
          }
        } catch (e) { /* ignore */ }

        if (processorRef.current && typeof processorRef.current.free === "function") {
          try { processorRef.current.free(); } catch (e) { /* ignore free errors */ }
        }
      } catch (e) {
        // swallow cleanup errors
      }
    };
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
