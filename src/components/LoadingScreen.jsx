export default function LoadingScreen({ progress }) {
  return (
    <div className="fullscreen loading-screen">
      <div className="loading-inner">
        <div className="loading-title">⏳ CARGANDO...</div>
        <div className="loading-bar-wrap">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-pct">{progress}%</div>
      </div>
    </div>
  );
}
