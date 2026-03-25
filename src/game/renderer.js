import { CONFIG, SPRITES, WALLS, SEATS, CHEF_POS, GAME_STATE } from './config';
import { NAV_NODES, NAV_EDGES } from './entities';

// ─── Cache de sprites recortados ─────────────────────────────────────────────
const _cache = new Map();

function getCropped(img, sx, sy, sw, sh, dw, dh) {
  const key = `${sx}_${sy}_${Math.ceil(dw)}_${Math.ceil(dh)}`;
  if (_cache.has(key)) return _cache.get(key);
  const tmp = document.createElement('canvas');
  tmp.width  = Math.ceil(dw);
  tmp.height = Math.ceil(dh);
  const tc = tmp.getContext('2d');
  tc.imageSmoothingEnabled = false;
  tc.drawImage(img, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
  _cache.set(key, tmp);
  return tmp;
}

// ─── Cámara ──────────────────────────────────────────────────────────────────
export function getCamera(player, mapW = CONFIG.MAP_W, mapH = CONFIG.MAP_H) {
  const vw = CONFIG.VIEW_W / CONFIG.ZOOM;
  const vh = CONFIG.VIEW_H / CONFIG.ZOOM;
  return {
    x: Math.max(0, Math.min(player.x - vw / 2, mapW - vw)),
    y: Math.max(0, Math.min(player.y - vh / 2, mapH - vh)),
  };
}

function mapToScreen(mx, my, cam) {
  return {
    sx: (mx - cam.x) * CONFIG.ZOOM,
    sy: (my - cam.y) * CONFIG.ZOOM,
  };
}

// ─── Primitivas ──────────────────────────────────────────────────────────────
function drawShadow(ctx, mx, my, cam) {
  const { sx, sy } = mapToScreen(mx, my + 4, cam);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle   = '#000';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSprite(ctx, img, sprCfg, dir, frame, mx, my, cam) {
  if (!img?.width) return;
  const row = sprCfg.dirRow[dir] ?? 0;
  let col = frame % 4;
  
  // Skip frame 1 when direction is up (row 3, column 1)
  if (row === 3 && col === 1) {
    col = 2; // Use frame 2 instead to avoid completely
  }
  
  const sx  = sprCfg.gridX + col * sprCfg.cellW;
  const sy  = sprCfg.gridY + row * sprCfg.cellH;
  
  // Double check: if we're still trying to use row 3, column 1, skip it
  if (Math.abs(sx - (sprCfg.gridX + 1 * sprCfg.cellW)) < 1 && 
      Math.abs(sy - (sprCfg.gridY + 3 * sprCfg.cellH)) < 1) {
    // Use column 0 instead
    const sx = sprCfg.gridX + 0 * sprCfg.cellW;
  }
  
  const dw  = Math.ceil(sprCfg.cellW * sprCfg.scale * CONFIG.ZOOM);
  const dh  = Math.ceil(sprCfg.cellH * sprCfg.scale * CONFIG.ZOOM);
  const { sx: screenX, sy: screenY } = mapToScreen(mx, my, cam);
  const dx  = Math.round(screenX - dw / 2);
  const dy  = Math.round(screenY - dh * 0.88);
  const cropped = getCropped(img, sx, sy, sprCfg.cellW, sprCfg.cellH, dw, dh);
  ctx.drawImage(cropped, dx, dy);
}

// Dibuja el chef con su imagen dedicada (cheff.png)
// Si la imagen es más ancha que alta es un spritesheet horizontal,
// si es cuadrada o más alta, se trata como imagen estática
function drawChefSprite(ctx, img, sprCfg, dir, frame, mx, my, cam) {
  if (!img?.width) return;
  const isAnimated = img.naturalWidth > sprCfg.cellW * 2;
  const row = isAnimated ? (sprCfg.dirRow[dir] ?? 0) : 0;
  let col = isAnimated ? (frame % 4) : 0;
  
  // Skip frame 1 when direction is up (row 3, column 1)
  if (row === 3 && col === 1) {
    col = 2; // Use frame 2 instead to avoid completely
  }
  
  const sx  = sprCfg.gridX + col * sprCfg.cellW;
  const sy  = sprCfg.gridY + row * sprCfg.cellH;
  
  // Double check: if we're still trying to use row 3, column 1, skip it
  if (Math.abs(sx - (sprCfg.gridX + 1 * sprCfg.cellW)) < 1 && 
      Math.abs(sy - (sprCfg.gridY + 3 * sprCfg.cellH)) < 1) {
    // Use column 0 instead
    const sx = sprCfg.gridX + 0 * sprCfg.cellW;
  }
  
  const sw  = Math.min(sprCfg.cellW, img.naturalWidth  - sx);
  const sh  = Math.min(sprCfg.cellH, img.naturalHeight - sy);
  if (sw <= 0 || sh <= 0) return;
  const dw  = Math.ceil(sw * sprCfg.scale * CONFIG.ZOOM);
  const dh  = Math.ceil(sh * sprCfg.scale * CONFIG.ZOOM);
  const { sx: screenX, sy: screenY } = mapToScreen(mx, my, cam);
  const dx  = Math.round(screenX - dw / 2);
  const dy  = Math.round(screenY - dh * 0.88);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawLabel(ctx, text, mx, my, cam, color = '#f7c948') {
  const { sx, sy } = mapToScreen(mx, my, cam);
  const py = sy - 18;
  ctx.save();
  ctx.font      = '8px "Courier New"';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(sx - tw / 2, py - 10, tw, 13);
  ctx.fillStyle = color;
  ctx.fillText(text, sx, py);
  ctx.restore();
}

function drawPrompt(ctx, label, mx, my, cam) {
  const { sx, sy } = mapToScreen(mx, my, cam);
  const bob = Math.sin(Date.now() / 350) * 3;
  const py  = sy - 44 - bob;
  ctx.save();
  
  // Estilo grande y visible como solicitaste
  ctx.font      = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const tw = ctx.measureText(label).width + 20;
  const th = 28;
  
  // Fondo blanco completamente opaco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - tw / 2, py - th / 2, tw, th);
  
  // Borde negro grueso
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx - tw / 2, py - th / 2, tw, th);
  
  // Texto negro grande
  ctx.fillStyle = '#000000';
  ctx.fillText(label, sx, py);
  
  ctx.restore();
}

function drawSeatPrompt(ctx, seat, cam) {
  const { sx, sy } = mapToScreen(seat.x, seat.y, cam);
  const bob = Math.sin(Date.now() / 350) * 3; // Animación de flotación
  ctx.save();
  
  // Estilo grande y visible como solicitaste
  ctx.font      = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const label = '[ E ] SENTARSE';
  const tw    = ctx.measureText(label).width + 20;
  const th    = 28;
  const py    = sy - 50 - bob; // Posición más arriba con animación
  
  // Fondo blanco completamente opaco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - tw / 2, py - th / 2, tw, th);
  
  // Borde negro grueso
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx - tw / 2, py - th / 2, tw, th);
  
  // Texto negro grande
  ctx.fillStyle = '#000000';
  ctx.fillText(label, sx, py);
  
  ctx.restore();
}

function drawEatingAnim(ctx, imgPlayer, player, cam) {
  drawSprite(ctx, imgPlayer, player.spriteConfig, 'down', 1, player.x, player.y, cam);
  const { sx, sy } = mapToScreen(player.x, player.y, cam);
  const frames = ['🍽', '😋', '🍴', '😊'];
  ctx.save();
  ctx.font      = '18px serif';
  ctx.textAlign = 'center';
  ctx.fillText(frames[player.eatFrame % 4], sx, sy - 32);
  ctx.restore();
}

// ─── DEBUG: mostrar hitboxes y nodos (cambiar a true para ajuste fino) ────────────────
const DEBUG_WALLS = true;
const DEBUG_NAV_NODES = true;

function drawDebugWalls(ctx, walls, cam) {
  if (!DEBUG_WALLS) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,0,0.7)';    // Verde brillante
  ctx.fillStyle   = 'rgba(0,255,0,0.15)';   // Verde transparente
  ctx.lineWidth   = 1;
  for (const w of walls) {
    // Si es un círculo
    if (w.type === "circle") {
      const { sx, sy } = mapToScreen(w.x, w.y, cam);
      const radius = w.r * CONFIG.ZOOM;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }
    // Si es un rectángulo (comportamiento normal)
    else {
      const { sx, sy } = mapToScreen(w.x, w.y, cam);
      const sw = w.w * CONFIG.ZOOM;
      const sh = w.h * CONFIG.ZOOM;
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.fillRect(sx, sy, sw, sh);
    }
  }
  ctx.restore();
}

function drawDebugNavNodes(ctx, cam, navNodes, navEdges) {
  if (!DEBUG_NAV_NODES) return;
  
  ctx.save();
  
  // Dibujar conexiones (edges)
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)'; // Amarillo transparente
  ctx.lineWidth = 2;
  for (const [fromId, toIds] of Object.entries(navEdges)) {
    const fromNode = navNodes[fromId];
    if (!fromNode) continue;
    
    const { sx: fromX, sy: fromY } = mapToScreen(fromNode.x, fromNode.y, cam);
    
    for (const toId of toIds) {
      const toNode = navNodes[toId];
      if (!toNode) continue;
      
      const { sx: toX, sy: toY } = mapToScreen(toNode.x, toNode.y, cam);
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
  }
  
  // Dibujar nodos
  for (const [id, node] of Object.entries(navNodes)) {
    const { sx, sy } = mapToScreen(node.x, node.y, cam);
    
    // Color especial para el nodo de teleport
    if (id === 'TELEPORT') {
      ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'; // Magenta
      ctx.strokeStyle = 'rgba(255, 0, 255, 1)';
    } else {
      ctx.fillStyle = 'rgba(255, 165, 0, 0.6)'; // Naranja transparente
      ctx.strokeStyle = 'rgba(255, 165, 0, 1)';
    }
    
    ctx.lineWidth = 2;
    
    // Dibujar círculo del nodo
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Dibujar etiqueta del nodo
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id, sx, sy);
  }
  
  ctx.restore();
}

// ─── Frame principal ─────────────────────────────────────────────────────────
export function drawFrame(ctx, imgs, player, npcs, chef, nearSeat, dialogOpen, menuOpen, gameState, walls = []) {
  const mapW = imgs.map?.naturalWidth  || imgs.map?.width  || CONFIG.MAP_W;
  const mapH = imgs.map?.naturalHeight || imgs.map?.height || CONFIG.MAP_H;
  const cam  = getCamera(player, mapW, mapH);

  ctx.fillStyle = '#1a0e08';
  ctx.fillRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);

  // Mapa de fondo
  if (imgs.map?.width) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      imgs.map,
      Math.round(cam.x), Math.round(cam.y),
      Math.round(CONFIG.VIEW_W / CONFIG.ZOOM),
      Math.round(CONFIG.VIEW_H / CONFIG.ZOOM),
      0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H
    );
  }

  // Hitboxes de debug
  drawDebugWalls(ctx, walls, cam);
  drawDebugNavNodes(ctx, cam, NAV_NODES, NAV_EDGES);

  // Prompt silla cercana
  if (nearSeat && !player.seated) drawSeatPrompt(ctx, nearSeat, cam);

  // ── Depth sort por Y ─────────────────────────────────────────────────────
  // Quien tiene Y mayor (más abajo en pantalla) se dibuja encima
  const entities = [
    { type: 'player', ref: player, y: player.y },
    ...npcs.filter(n => n.visible).map(n => ({ type: 'npc',  ref: n,    y: n.y    })),
    ...(chef?.visible ? [{ type: 'chef', ref: chef, y: chef.y }] : []),
  ].sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.type === 'player') {
      if (player.eating) {
        drawEatingAnim(ctx, imgs.player, player, cam);
      } else {
        drawShadow(ctx, player.x, player.y, cam);
        drawSprite(
          ctx, imgs.player, player.spriteConfig,
          player.dir,
          player.seated ? 1 : player.frame,
          player.x, player.y, cam
        );
      }

    } else if (e.type === 'npc') {
      const npc = e.ref;
      drawShadow(ctx, npc.x, npc.y, cam);
      
      // Usar waiterFood2 cuando está sirviendo
      const waiterImg = gameState === GAME_STATE.SERVING ? imgs.waiterFood2 : imgs.waiter;
      drawSprite(ctx, waiterImg, SPRITES.waiter, npc.dir, npc.frame, npc.x, npc.y, cam);
      
      if (!dialogOpen && !menuOpen && npc.isNearPlayer(player)) {
        drawPrompt(ctx, '[ E ] Hablar', npc.x, npc.y, cam);
      }

    } else if (e.type === 'chef') {
      const chefEntity = e.ref;
      drawShadow(ctx, chefEntity.x, chefEntity.y, cam);
      // Usa imgs.chef (cheff.png) si está cargado, si no usa el sprite del waiter
      if (imgs.chef?.width) {
        drawChefSprite(ctx, imgs.chef, SPRITES.chef, chefEntity.dir, chefEntity.frame, chefEntity.x, chefEntity.y, cam);
      } else {
        drawSprite(ctx, imgs.waiter, SPRITES.waiter, chefEntity.dir, chefEntity.frame, chefEntity.x, chefEntity.y, cam);
      }
      if (!dialogOpen && chef.isNearPlayer(player)) {
        drawPrompt(ctx, '[ E ] Chef', chefEntity.x, chefEntity.y, cam);
      }
    }
  }
}