import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useAssets }     from './hooks/useAssets';
import { useGameLoop }   from './game/useGameLoop';
import { CONFIG }        from './game/config';

import LoadingScreen  from './components/LoadingScreen';
import TitleScreen    from './components/TitleScreen';
import HUD            from './components/HUD';
import DialogBox      from './components/DialogBox';
import MenuOverlay    from './components/MenuOverlay';
import YesNoOverlay   from './components/YesNoOverlay';
import PaymentOverlay from './components/PaymentOverlay';

import mapSrc    from './assets/map.jpg';
import playerBoySrc from './assets/player.jpg';
import playerGirlSrc from './assets/pLayer2chica.png';
import waiterSrc from './assets/waiter.jpg';
import chefSrc   from './assets/cheff.png';
import waiterBSrc from './assets/waiterB.jpg';
import playerPortraitBoySrc from './assets/playerBig1.png';
import playerPortraitGirlSrc from './assets/player2.png';
import musicSrc from './assets/Musica Para Restaurante Elegante.mp3';

const IMAGE_SOURCES = {
  map:    mapSrc,
  playerBoy: playerBoySrc,
  playerGirl: playerGirlSrc,
  waiter: waiterSrc,
  chef:   chefSrc,
  waiterB: waiterBSrc,
  playerPortraitBoy: playerPortraitBoySrc,
  playerPortraitGirl: playerPortraitGirlSrc,
  music: musicSrc,
};

export default function App() {
  const canvasRef = useRef(null);
  const [screen, setScreen] = useState('loading'); // 'loading' | 'title' | 'game'
  const [selectedCharacter, setSelectedCharacter] = useState('boy');
  const [charModalOpen, setCharModalOpen] = useState(false);

  const { imgs, progress } = useAssets(IMAGE_SOURCES);

  useEffect(() => {
    if (imgs) setScreen('title');
  }, [imgs]);

  const handleStart = useCallback(() => {
    setCharModalOpen(true);
  }, []);

  const handleConfirmCharacter = useCallback(() => {
    setCharModalOpen(false);
    setScreen('game');
  }, []);

  const selectedImgs = useMemo(() => {
    if (!imgs) return imgs;
    const isGirl = selectedCharacter === 'girl';
    return {
      ...imgs,
      player: isGirl ? imgs.playerGirl : imgs.playerBoy,
      playerPortrait: isGirl ? imgs.playerPortraitGirl : imgs.playerPortraitBoy,
    };
  }, [imgs, selectedCharacter]);

  // Música de fondo
  useEffect(() => {
    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.volume = 0.3; // Volumen moderado
    
    // Iniciar música cuando la carga esté completa
    const startMusic = () => {
      audio.play().catch(e => console.log('Error reproduciendo música:', e));
    };
    
    if (screen === 'title' || screen === 'game') {
      // Esperar un poco para asegurar que el usuario haya interactuado
      setTimeout(startMusic, 100);
    }
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [screen, musicSrc]);

  const {
    dialog, menuOpen, payOpen, yesNoOpen, yesNoData,
    orderTotal, hint,
    advanceDialog, confirmOrder,
    payWithCard, payWithCash,
    setMenuOpen, setPayOpen,
    cancelOrder, exitDialog,
  } = useGameLoop(canvasRef, selectedImgs, screen === 'game', selectedCharacter);

  return (
    <div className="app-root">

      {screen === 'loading' && <LoadingScreen progress={progress} />}
      {screen === 'title'   && <TitleScreen onStart={handleStart} />}

      {screen === 'title' && charModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'auto' }}>
          <div style={{ background: '#0d0703', border: '4px solid #f7c948', boxShadow: '6px 6px 0 #000', padding: '18px 18px', minWidth: 320, textAlign: 'center' }}>
            <div style={{ color: '#f7c948', fontFamily: 'inherit', fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>ELIGE TU PERSONAJE</div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 14 }}>
              <button
                className="btn-play"
                style={{ opacity: selectedCharacter === 'boy' ? 1 : 0.6, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
                onClick={() => setSelectedCharacter('boy')}
              >
                <div style={{ width: 170, height: 170, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={imgs?.playerPortraitBoy?.src || playerPortraitBoySrc}
                    alt="PLAYER 1"
                    style={{ width: 120, height: 120, imageRendering: 'pixelated', objectFit: 'contain', transform: 'scale(1.6)', transformOrigin: 'center center' }}
                  />
                </div>
                PLAYER 1
              </button>
              <button
                className="btn-play"
                style={{ opacity: selectedCharacter === 'girl' ? 1 : 0.6, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
                onClick={() => setSelectedCharacter('girl')}
              >
                <div style={{ width: 170, height: 170, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={imgs?.playerPortraitGirl?.src || playerPortraitGirlSrc}
                    alt="PLAYER 2"
                    style={{ width: 230, height: 230, imageRendering: 'pixelated', objectFit: 'contain', transform: 'scale(1.2)', transformOrigin: 'center center', objectPosition: 'center 30%' }}
                  />
                </div>
                PLAYER 2
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-play" onClick={handleConfirmCharacter}>CONFIRMAR</button>
              <button className="btn-play" onClick={() => setCharModalOpen(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div
        className="game-wrapper"
        style={{ visibility: screen === 'game' ? 'visible' : 'hidden', position: screen === 'game' ? 'relative' : 'absolute' }}
      >
        <canvas ref={canvasRef} width={CONFIG.VIEW_W} height={CONFIG.VIEW_H} className="game-canvas" />
        <HUD hint={hint} />
        <DialogBox dialog={dialog} imgs={selectedImgs} onAdvance={advanceDialog} onCancel={exitDialog} />
        <MenuOverlay open={menuOpen} onConfirm={confirmOrder} onClose={() => {
  setMenuOpen(false);
  exitDialog();
}} />
        <YesNoOverlay open={yesNoOpen} data={yesNoData} />
        <PaymentOverlay open={payOpen} total={orderTotal} onCard={payWithCard} onCash={payWithCash} onClose={() => setPayOpen(false)} />
      </div>

    </div>
  );
}