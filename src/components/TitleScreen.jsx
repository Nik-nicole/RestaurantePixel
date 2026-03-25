import { useEffect } from 'react';

export default function TitleScreen({ onStart }) {
  useEffect(() => {
    const handler = () => onStart();
    window.addEventListener('keydown', handler, { once: true });
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  return (
    <div className="fullscreen title-screen">
      <h1 className="title-h1">🍽 PIXEL RESTAURANT</h1>
      <p  className="title-sub">Un algoritmo hecho videojuego</p>
      <button className="btn-play" onClick={onStart}>▶ JUGAR</button>
      <div className="hint-key blink">— O PRESIONA CUALQUIER TECLA —</div>
    </div>
  );
}
