import Videoplayer from "./components/Videoplayer";

export default function App() {
  return (
    <div style={{display: "flex",  flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw"}}>
     <h1>OxidePlayer</h1>
     <div style={{width: "600px", height: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
          <Videoplayer videoSrc="/testVideo.mp4" showProcessingSnackbar={true} />
     </div>
    
    </div>
  );
}
