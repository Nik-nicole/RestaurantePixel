import { useEffect } from 'react';
import { SPRITES } from '../game/config';
import waiterImage from '../assets/waiter.jpg';
import chefImage from '../assets/cheff.png';
import chefBigImage from '../assets/chefBig.png';
import waiterBImage from '../assets/waiterB.jpg';
import waiterFoodImage from '../assets/waiterFood.png';
import waiterFood2Image from '../assets/waiterFood2.png';

const SPEAKER_META = {
  player: { name: 'TÚ',          color: '#ffffffff', sprKey: 'player' },
  waiter: { name: 'MESERO',       color: '#ffffffff', sprKey: 'waiter' },
  chef:   { name: 'CHEF MARCO',   color: '#000000', sprKey: 'waiter' },
};

export default function DialogBox({ dialog, imgs, onAdvance, onCancel }) {
  // Manejar ambos casos: array de líneas o objeto con propiedad lines
  const lines = Array.isArray(dialog) ? dialog : (dialog?.lines || []);
  const line = dialog && dialog.index !== undefined ? lines[dialog.index] : (lines[0] || null);
  const speaker = line?.speaker ?? 'waiter';
  const meta    = SPEAKER_META[speaker] ?? SPEAKER_META.waiter;

  if (!dialog || (!Array.isArray(dialog) && !dialog.lines)) return null;

  const isLeft = speaker === 'player';
  
  // Verificar si es el diálogo de servir (contiene "pedido")
  const isServingDialog = line?.text?.toLowerCase().includes('pedido');
  
  // Determinar qué imagen mostrar
  const speakerImage = speaker === 'player' ? (imgs?.playerPortrait || waiterImage) : 
                       speaker === 'chef' ? chefBigImage : 
                       waiterBImage; // Siempre usar waiterB.jpg para el mesero

  return (
    <>
      <img 
        src={speakerImage} 
        alt={speaker}
        className={`dialog-speaker-image ${isLeft ? 'speaker-left' : 'speaker-right'}`}
      />
      <div
        className={`dialog-box ${isLeft ? 'speaker-left' : 'speaker-right'}`}
        onClick={onAdvance}
      >
        <div className="dialog-content">
          <div className="dialog-speaker">
            {meta.name}
          </div>
          <div className="dialog-text">{line?.text}</div>
          <div className="dialog-actions">
            <div className="dialog-more">▼ ESPACIO / CLIC para continuar</div>
            {onCancel && (
              <div className="dialog-exit" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                B - Salir
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
