import { useEffect, useRef, useState } from "react";
import VideoPlayerControls from "./VideoPlayerControls";
import styles from "./CSS/Videoplayer.module.css";

export interface VideoplayerProps {
  videoSrc: string;
  style?: React.CSSProperties;
  showProcessingSnackbar?: boolean;
}

export default function Videoplayer({ videoSrc, showProcessingSnackbar = false }: VideoplayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<any>(null);
  const [framesProcessed, setFramesProcessed] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(showProcessingSnackbar);

  useEffect(() => {
    (async () => {
      try {
        // Resolve wasm pkg relative to this module
        // In dev: src/components/Videoplayer.tsx -> src/pkg/ (../pkg)
        // In production: dist/oxideplayer.esm.js -> dist/pkg/ (./pkg)
        const isDev = import.meta.url.includes('/src/components/');
        const wasmJsUrl = isDev 
          ? new URL("../pkg/rust_wasm.js", import.meta.url).href
          : new URL("./pkg/rust_wasm.js", import.meta.url).href;
        
        const wasm = await import(/* @vite-ignore */ wasmJsUrl);
        // Let rust_wasm.js resolve the .wasm file itself using its own import.meta.url
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
        className={`${styles.videoElement} ${styles}`}
      />
      <VideoPlayerControls videoRef={videoRef} containerRef={containerRef} />
      
      {/* Frames Processed Snackbar */}
      {showSnackbar && (
        <div className={styles.snackbar}>
          <div className={styles.snackbarContent}>
            <div className={styles.snackbarIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.snackbarText}>
              <span className={styles.snackbarLabel}>WASM Processing</span>
              <span className={styles.snackbarFrames}>{framesProcessed.toLocaleString()} frames</span>
            </div>
          </div>
          <button 
            className={styles.snackbarClose}
            onClick={() => setShowSnackbar(false)}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
