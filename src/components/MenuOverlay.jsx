import { useState, useEffect, useRef } from 'react';
import { MENU_ITEMS } from '../game/config';
import haburguesaImg from '../assets/haburguesa.png';
import sopaImg from '../assets/sopa.png';
import jugoImg from '../assets/jugo.png';
import ensaladaImg from '../assets/ensalada.png';
import papasImg from '../assets/papas.png';
import pastaImg from '../assets/pasta.png';
import pastelImg from '../assets/pastel.png';
import bistecImg from '../assets/Bistec.png';
import cafeImg from '../assets/cafe.png';

// Crear objetos Image para cada imagen importada
const createImage = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

// Mapa de imágenes específicas para cada item
const CUSTOM_IMAGES = {
  burger: createImage(haburguesaImg),    // Hamburguesa usa haburguesa.png
  pizza: createImage(pastaImg),          // Pizza usa pasta.png
  coffee: createImage(cafeImg),          // Café usa cafe.png
  soup: createImage(sopaImg),            // Sopa del día usa sopa.png
  juice: createImage(jugoImg),           // Jugo natural usa jugo.png
  salad: createImage(ensaladaImg),       // Ensalada usa ensalada.png
  fries: createImage(papasImg),          // Papas fritas usa papas.png
  pasta: createImage(pastaImg),          // Pasta usa pasta.png
  cake: createImage(pastelImg),          // Pastel usa pastel.png
  steak: createImage(bistecImg),         // Bistec usa Bistec.png
};

function FoodIcon({ item }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(0, 0, 48, 48);

    // Usar imagen específica si está disponible
    const customImage = CUSTOM_IMAGES[item.id];
    
    const drawImage = () => {
      if (customImage && (customImage.complete || customImage.naturalWidth > 0)) {
        ctx.drawImage(customImage, 2, 2, 44, 44);
      } else {
        // Fallback a emoji si no hay imagen específica
        ctx.font      = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.emoji, 24, 28);
      }
    };

    if (customImage && !customImage.complete) {
      customImage.onload = drawImage;
      customImage.onerror = () => {
        console.error('Error loading image:', item.id);
        // Fallback to emoji
        ctx.font      = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.emoji, 24, 28);
      };
    }

    drawImage();
  }, [item, CUSTOM_IMAGES]);

  return (
    <canvas
      ref={ref}
      width={48} height={48}
      style={{ imageRendering: 'pixelated', width: '64px', height: '64px' }}
    />
  );
}

export default function MenuOverlay({ open, onConfirm, onClose }) {
  const [quantities, setQuantities] = useState({});

  // Reset al abrir
  useEffect(() => { if (open) setQuantities({}); }, [open]);

  if (!open) return null;

  const change = (id, delta) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));

  const total = MENU_ITEMS.reduce((s, i) => s + (quantities[i.id] ?? 0) * i.price, 0);
  const count = MENU_ITEMS.reduce((s, i) => s + (quantities[i.id] ?? 0), 0);

  const handleConfirm = () => {
    const ordered = MENU_ITEMS
      .filter(i => (quantities[i.id] ?? 0) > 0)
      .map(i    => ({ ...i, qty: quantities[i.id] }));
    if (ordered.length) onConfirm(ordered);
  };

  return (
    <div className="overlay-backdrop">
      <div className="menu-window">
        <div className="menu-header">
          <h2>📋 MENÚ DEL DÍA</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="menu-grid">
          {MENU_ITEMS.map(item => {
            const qty       = quantities[item.id] ?? 0;
            const selected  = qty > 0;
            return (
              <div key={item.id} className={`menu-card ${selected ? 'selected' : ''}`}>
                <FoodIcon item={item} />
                <div className="menu-card-name">{item.name}</div>
                <div className="menu-card-price">${item.price.toLocaleString('es-CO')}</div>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => change(item.id, -1)}>−</button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => change(item.id, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="menu-footer">
          <span className="menu-total">TOTAL: ${total.toLocaleString('es-CO')}</span>
          <button className="btn-confirm" disabled={count === 0} onClick={handleConfirm}>
            ✔ ORDENAR
          </button>
        </div>
      </div>
    </div>
  );
}
