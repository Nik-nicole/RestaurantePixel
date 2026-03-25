import { useRef, useState, useCallback, useEffect } from 'react';
import { GAME_STATE, CONFIG, SPRITES, WALLS, SEATS, CHEF_POS, NPC_START, PLAYER_START, MENU_ITEMS, DIALOGS } from './config';
import { Player, NPC, Chef, collidesWall } from './entities';
import { drawFrame } from './renderer';
import LoadingScreen from '../components/LoadingScreen';

// Fallback local para findNearSeat por si hay problemas de importación
function findNearSeatLocal(player) {
  return SEATS.find(
    s => Math.abs(s.x - player.x) < 38 && Math.abs(s.y - player.y) < 38
  ) || null;
}

/**
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef  ← recibe el REF, no .current
 * @param {Object} imgs                                 ← objeto de imágenes precargadas
 * @param {boolean} started                             ← controla si el loop corre
 * @returns {Object}                                    ← API del hook
 */
export function useGameLoop(canvasRef, imgs, started, characterType = 'boy') {
  const playerRef = useRef(null);
  const npcsRef   = useRef([]);
  const chefRef   = useRef(null);
  const keysRef   = useRef({});
  const rafRef    = useRef(null);

  const [gameState,  setGameState]  = useState(GAME_STATE.FREE);
  const [dialog,     setDialog]     = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [payOpen,    setPayOpen]    = useState(false);
  const [yesNoOpen,  setYesNoOpen]  = useState(false);
  const [yesNoData,  setYesNoData]  = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [hint,       setHint]       = useState('↑↓←→ / WASD — Mover   E — Interactuar');
  const [nearSeat,   setNearSeat]   = useState(null);

  const gameStateRef      = useRef(GAME_STATE.FREE);
  const dialogRef         = useRef(null);
  const menuOpenRef       = useRef(false);
  const orderTotalRef     = useRef(0);
  const assignedWaiterRef = useRef(null);

  const _setGameState = useCallback((s) => { gameStateRef.current = s; setGameState(s); }, []);
  const _setDialog    = useCallback((d) => { dialogRef.current = d;    setDialog(d);    }, []);
  const _setMenuOpen  = useCallback((v) => { menuOpenRef.current = v;  setMenuOpen(v);  }, []);

  const emit = useCallback((event) => {
    if (event === 'eating:done') _onEatingDone();
  }, []); // eslint-disable-line

  const openDialog = useCallback((lines, onDone = null) => {
    _setDialog({ lines, index: 0, onDone });
  }, [_setDialog]);

  const advanceDialog = useCallback(() => {
    const d = dialogRef.current;
    if (!d) return;
    
    // Manejar ambos casos: objeto con lines o array directo
    const lines = Array.isArray(d) ? d : (d.lines || []);
    const currentIndex = Array.isArray(d) ? 0 : (d.index || 0);
    const next = currentIndex + 1;
    
    if (next >= lines.length) {
      _setDialog(null);
      const onDone = Array.isArray(d) ? null : d.onDone;
      if (onDone) setTimeout(onDone, 80);
    } else {
      if (Array.isArray(d)) {
        // Si es un array, crear objeto con index
        _setDialog({ lines: d, index: next });
      } else {
        _setDialog({ ...d, index: next });
      }
    }
  }, [_setDialog]);

  // ── Flujo restaurante ────────────────────────────────────────────────────

  const _waiterApproaches = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE.SITTING) return;
    const player = playerRef.current;
    const npcs   = npcsRef.current;
    const waiter = npcs.reduce((a, b) =>
      Math.hypot(a.x - player.x, a.y - player.y) <
      Math.hypot(b.x - player.x, b.y - player.y) ? a : b
    );
    assignedWaiterRef.current = waiter;
    waiter.walkTo(player.x + 80, player.y, () => {
      waiter.dir = 'left';
      openDialog(DIALOGS.waiter_approach, () => {
        _setGameState(GAME_STATE.ORDERING);
        _setMenuOpen(true);
      });
    });
  }, [openDialog, _setGameState, _setMenuOpen]);

  const _sitDown = useCallback((seat) => {
    playerRef.current.sitAt(seat.x, seat.y);
    _setGameState(GAME_STATE.SITTING);
    setHint('Esperando al mesero...');
    setTimeout(_waiterApproaches, 1200);
  }, [_setGameState, _waiterApproaches]);

  const confirmOrder = useCallback((ordered) => {
    _setMenuOpen(false);
    const total = ordered.reduce((s, i) => s + i.price * i.qty, 0);
    orderTotalRef.current = total;
    setOrderTotal(total);
    const summary = ordered.map(i => `${i.name}×${i.qty}`).join(', ');
    openDialog(DIALOGS.waiter_confirm(summary), () => {
      setYesNoData({
        label: '¿Confirmar pedido?',
        onYes: () => {
          setYesNoOpen(false);
          openDialog(DIALOGS.waiter_toKitchen, () => {
            _setGameState(GAME_STATE.WAITER_GOING);
            _goKitchen();
          });
        },
        onNo: () => {
          setYesNoOpen(false);
          _setGameState(GAME_STATE.ORDERING);
          setTimeout(() => _setMenuOpen(true), 200);
        },
      });
      setYesNoOpen(true);
    });
  }, [openDialog, _setGameState, _setMenuOpen]); // eslint-disable-line

  const _goKitchen = useCallback(() => {
    const waiter = assignedWaiterRef.current;
    if (!waiter) return;
    // El mesero sigue la ruta dibujada → llega al arco → teleporta a la cocina
    waiter.walkToKitchen(() => {
      // Ya está dentro de la cocina (teleportado)
      openDialog(DIALOGS.chef_busy, () => {
        _setGameState(GAME_STATE.COOKING);
        setHint('Puedes moverte mientras esperas tu pedido...');
        setTimeout(() => {
          _setGameState(GAME_STATE.ORDER_READY);
          setHint('E / ESPACIO — Responder al mesero');
          openDialog(DIALOGS.order_ready, () => {
            // Esperar respuesta del jugador
          });
        }, 3000);
      });
    });
  }, [openDialog, _setGameState]); // eslint-disable-line

  const _acceptOrder = useCallback(() => {
    const waiter = assignedWaiterRef.current;
    if (!waiter) return;
    
    openDialog(DIALOGS.order_response, () => {
      _setGameState(GAME_STATE.SERVING);
      setHint('El mesero viene con tu pedido...');
      
      // El mesero se teletransporta a U4 y luego viene con el pedido
      waiter._busy = true;
      waiter.visible = false;
      setTimeout(() => {
        waiter.x = 1140; // Coordenada de U4
        waiter.y = 630;
        waiter.dir = 'down';
        waiter.visible = true;
        waiter._busy = false;
        
        // Ahora viene hacia el jugador pasando por U2 y R5
        waiter.walkTo(playerRef.current.x + 80, playerRef.current.y, () => {
          waiter.dir = 'left';
          openDialog(DIALOGS.waiter_serving, () => {
            _setGameState(GAME_STATE.EATING);
            playerRef.current.startEating();
            setHint('Disfrutando la comida...');
            waiter.returnToPost();
          });
        });
      }, 250);
    });
  }, [openDialog, _setGameState]);

  const _cancelOrder = useCallback(() => {
    _setMenuOpen(false);
    openDialog(DIALOGS.order_cancel, () => {
      playerRef.current?.stand();
      _setGameState(GAME_STATE.FREE);
      setHint('↑↓←→ / WASD — Mover   E — Interactuar');
      assignedWaiterRef.current?.returnToPost();
    });
  }, [openDialog, _setGameState, _setMenuOpen]);

  const _exitDialog = useCallback(() => {
    // Simplemente cerrar el diálogo actual sin abrir otro
    _setDialog(null);
    dialogRef.current = null;  // Reset explícito de la referencia
    
    // Resetear completamente el estado del jugador
    const player = playerRef.current;
    if (player) {
      // Resetear todas las propiedades que pueden bloquear el movimiento
      player.seated = false;      // No está sentado
      player.eating = false;      // No está comiendo
      player.moving = false;      // Resetear estado de movimiento
      player.frame = 1;           // Frame inicial
      player.fTimer = 0;          // Resetear animación
      player.eatTimer = 0;        // Resetear timer de comida
      player.eatFrame = 0;        // Resetear frame de comida
      
      // Resetear posición a una segura (evitar colisiones de silla)
      player.x = PLAYER_START.x;
      player.y = PLAYER_START.y;
      player.dir = 'down';
      
      // Si tiene método stand, llamarlo (por si hace algo extra)
      if (typeof player.stand === 'function') {
        player.stand();
      }
    }
    
    // Resetear estado del juego
    _setGameState(GAME_STATE.FREE);
    setHint('↑↓←→ / WASD — Mover   E — Interactuar');
    
    // Resetear NPCs y Chef a sus posiciones iniciales
    const npcs = npcsRef.current;
    if (Array.isArray(npcs)) {
      for (const npc of npcs) {
        if (!npc) continue;
        npc._busy = false;
        npc.visible = true;
        if (typeof npc.returnToPost === 'function') npc.returnToPost();
      }
    }
    const chef = chefRef.current;
    if (chef) {
      chef.visible = true;
      chef._busy = false;
      if (typeof chef.returnToPost === 'function') chef.returnToPost();
      else {
        chef.x = CHEF_POS.x;
        chef.y = CHEF_POS.y;
      }
    }
    assignedWaiterRef.current = null;
  }, [_setDialog, _setGameState]);

  const _bringFood = useCallback(() => {
    const waiter = assignedWaiterRef.current;
    const player = playerRef.current;
    if (!waiter || !player) return;
    // Sale de la cocina: aparece en la boca del arco y camina al jugador
    waiter.exitKitchen(() => {
      _setGameState(GAME_STATE.SERVING);
      waiter.walkTo(player.x + 80, player.y, () => {
        waiter.dir = 'left';
        openDialog(DIALOGS.waiter_serving, () => {
          _setGameState(GAME_STATE.EATING);
          player.startEating();
          setHint('Disfrutando la comida...');
          waiter.returnToPost();
        });
      });
    });
  }, [openDialog, _setGameState]);

  const _onEatingDone = useCallback(() => {
    _setGameState(GAME_STATE.EATING_DONE);
    setHint('E / ESPACIO — Pedir la cuenta');
    
    // Mover jugador lejos de la mesa para que pueda moverse libremente
    const player = playerRef.current;
    if (player) {
      // Determinar dirección para moverse lejos (50px en lugar de 20px)
      const directions = [
        { dx: 50, dy: 0 },   // derecha
        { dx: -50, dy: 0 },  // izquierda
        { dx: 0, dy: 50 },   // abajo
        { dx: 0, dy: -50 }   // arriba
      ];
      
      // Intentar cada dirección hasta encontrar una sin colisión
      for (const { dx, dy } of directions) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Verificar si la nueva posición no colide con paredes
        if (!collidesWall(newX, newY)) {
          player.x = newX;
          player.y = newY;
          player.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
          break; // Salir del loop cuando encuentre posición válida
        }
      }
      
      // Si todas las direcciones fallan, mover a posición segura
      if (collidesWall(player.x, player.y)) {
        player.x = PLAYER_START.x;
        player.y = PLAYER_START.y;
        player.dir = 'down';
      }
    }
  }, [_setGameState]);

  const requestBill = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE.EATING_DONE) return;
    
    // Mostrar diálogo de confirmación primero
    openDialog(DIALOGS.bill_request, () => {
      _setGameState(GAME_STATE.BILL);
      const waiter = assignedWaiterRef.current;
      const player = playerRef.current;
      if (!waiter || !player) return;
      const iva   = Math.round(orderTotalRef.current * 0.19);
      const total = orderTotalRef.current + iva;
      orderTotalRef.current = total;
      setOrderTotal(total);
      waiter.walkTo(player.x + 80, player.y, () => {
        waiter.dir = 'left';
        openDialog(DIALOGS.bill_question, () => {
          _setGameState(GAME_STATE.PAYING);
          setPayOpen(true);
        });
      });
    });
  }, [openDialog, _setGameState]);

  const payWithCard = useCallback(() => {
    setPayOpen(false);
    openDialog(DIALOGS.pay_card, () => {
      openDialog(DIALOGS.goodbye, () => {
        playerRef.current?.stand();
        _setGameState(GAME_STATE.FREE);
        setHint('↑↓←→ / WASD — Mover   E — Interactuar');
        assignedWaiterRef.current?.returnToPost();
      });
    });
  }, [openDialog, _setGameState]);

  const payWithCash = useCallback((paid) => {
    const change = paid - orderTotalRef.current;
    if (change < 0) return false;
    setPayOpen(false);
    openDialog(DIALOGS.pay_cash(change), () => {
      openDialog(DIALOGS.goodbye, () => {
        playerRef.current?.stand();
        _setGameState(GAME_STATE.FREE);
        setHint('↑↓←→ / WASD — Mover   E — Interactuar');
        assignedWaiterRef.current?.returnToPost();
      });
    });
    return true;
  }, [openDialog, _setGameState]);

  // ── Teclado ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      keysRef.current[e.code] = true;
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','KeyB'].includes(e.code))
        e.preventDefault();

      if ((e.code === 'Space' || e.code === 'KeyE') && dialogRef.current) {
        advanceDialog(); return;
      }
      if (e.code === 'KeyB' && dialogRef.current) {
        _exitDialog(); return;
      }
      if (e.code === 'KeyE' || e.code === 'Space') {
        if (menuOpenRef.current) {
          if (e.code === 'Escape') {
            _cancelOrder(); return;
          }
          return;
        }
        const state  = gameStateRef.current;
        const player = playerRef.current;
        const npcs   = npcsRef.current;
        const chef   = chefRef.current;
        if (state === GAME_STATE.FREE) {
          const seat = findNearSeatLocal(player);
          if (seat) { _sitDown(seat); return; }
          for (const npc of npcs) {
            if (npc.isNearPlayer(player)) { openDialog(DIALOGS.waiter_approach, null); return; }
          }
          if (chef?.isNearPlayer(player)) { openDialog(DIALOGS.chef_hello, null); return; }
        }
        if (state === GAME_STATE.ORDER_READY) {
          _acceptOrder(); return;
        }
        if (state === GAME_STATE.EATING_DONE) requestBill();
      }
    };
    const onUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [advanceDialog, openDialog, _sitDown, requestBill]);

  // ── Game loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imgs || !started) return;

    // ✅ Accedemos a .current DENTRO del useEffect, cuando el DOM ya existe
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = CONFIG.VIEW_W;
    canvas.height = CONFIG.VIEW_H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const spriteConfig = characterType === 'girl' ? SPRITES.player2 : SPRITES.player;
    playerRef.current = new Player(PLAYER_START.x, PLAYER_START.y, spriteConfig);
    npcsRef.current   = NPC_START.map(d => new NPC(d));
    chefRef.current   = new Chef();

    const loop = () => {
      const player = playerRef.current;
      const npcs   = npcsRef.current;
      const chef   = chefRef.current;
      const keys   = keysRef.current;
      const state  = gameStateRef.current;

      const blocked = !!dialogRef.current || menuOpenRef.current;
      let dx = 0, dy = 0;
      if (!blocked && (state === GAME_STATE.FREE || state === GAME_STATE.COOKING || state === GAME_STATE.ORDER_READY)) {
        if (keys['ArrowUp']    || keys['KeyW']) dy = -1;
        if (keys['ArrowDown']  || keys['KeyS']) dy =  1;
        if (keys['ArrowLeft']  || keys['KeyA']) dx = -1;
        if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
        if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
      }

      player.update({ dx, dy }, emit);
      npcs.forEach(n => n.update());
      chef.update();

      const seat = state === GAME_STATE.FREE ? findNearSeatLocal(player) : null;
      setNearSeat(seat);

      drawFrame(ctx, imgs, player, npcs, chef, seat, !!dialogRef.current, menuOpenRef.current, state, WALLS);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);

  // canvasRef es estable (useRef), imgs y started sí pueden cambiar
  }, [imgs, started, emit, advanceDialog, openDialog, _sitDown, requestBill]); // eslint-disable-line

  return {
    gameState, dialog, menuOpen, payOpen, yesNoOpen, yesNoData,
    orderTotal, hint, nearSeat,
    advanceDialog, confirmOrder, requestBill,
    payWithCard, payWithCash,
    setMenuOpen:  _setMenuOpen,
    setPayOpen,
    setYesNoOpen,
    cancelOrder: _cancelOrder,
    exitDialog: _exitDialog,
  };
}