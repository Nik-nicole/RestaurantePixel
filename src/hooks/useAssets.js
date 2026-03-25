import { useState, useEffect } from 'react';

/**
 * Carga todas las imágenes del juego y reporta el progreso.
 * Recibe un objeto { key: dataURL } y devuelve { imgs, progress, error }.
 */
export function useAssets(sources) {
  const [imgs,     setImgs]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!sources) return;

    const keys   = Object.keys(sources);
    const loaded  = {};
    let   done    = 0;

    function loadOne(key) {
      return new Promise((resolve) => {
        const img    = new Image();
        img.onload   = () => { loaded[key] = img; done++; setProgress(Math.round(done / keys.length * 100)); resolve(); };
        img.onerror  = () => { console.warn(`Asset failed: ${key}`); loaded[key] = new Image(); done++; setProgress(Math.round(done / keys.length * 100)); resolve(); };
        img.src      = sources[key];
      });
    }

    Promise.all(keys.map(loadOne))
      .then(() => setImgs(loaded))
      .catch(e  => setError(e.message));
  }, [sources]); // eslint-disable-line react-hooks/exhaustive-deps

  return { imgs, progress, error };
}
