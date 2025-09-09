import { useEffect, useState, useRef } from "react";

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [framesProcessed, setFramesProcessed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processorRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const wasm = await import("./pkg/rust_wasm.js");
        await wasm.default();
        
        if (videoRef.current) {
          const VideoProcessor = wasm.VideoProcessor;
          console.log("VideoProcessor initialized");
          
          // Store processor instance in ref
          processorRef.current = new VideoProcessor('video-element');
          
          // Add timeupdate event listener to video
          videoRef.current.addEventListener('timeupdate', () => {
            if (processorRef.current) {
              processorRef.current.process_frame();
              setFramesProcessed(processorRef.current.get_frames_processed());
            }
          });
        }
        
        setInitialized(true);
      } catch (err) {
        console.error("Failed to initialize wasm module:", err);
      }
    })();

    // Cleanup
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', () => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h3>Rust Video player</h3>
      <div style={{ marginBottom: 10 }}>
        Frames Processed: {framesProcessed}
      </div>
      <video
        id="video-element"
        ref={videoRef}
        controls
        src="/testvideo.mp4"
        height="400"
      />
    </div>
  );
}