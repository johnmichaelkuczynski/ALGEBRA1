export default function App() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <video
        className="h-full w-full object-contain"
        src={`${import.meta.env.BASE_URL}algebra-1-app-walkthrough.mp4`}
        poster={`${import.meta.env.BASE_URL}algebra-1-poster.jpg`}
        controls
        playsInline
        preload="metadata"
        aria-label="Narrated walkthrough of the working Algebra 1 app"
      />
    </main>
  );
}
