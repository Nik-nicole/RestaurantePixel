import { CONFIG, WALLS, SEATS, CHEF_POS } from './config';

// ─── Colisiones ───────────────────────────────────────────────────────────────
export function collidesWall(x, y, r = CONFIG.PLAYER_COLLIDER) {
  for (const w of WALLS) {
    // Si es un círculo
    if (w.type === "circle") {
      const dx = x - w.x;
      const dy = y - w.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < w.r + r) return true;
    }
    // Si es un rectángulo (comportamiento normal)
    else if (x+r > w.x && x-r < w.x+w.w && y+r > w.y && y-r < w.y+w.h) {
      return true;
    }
  }
  return false;
}

// ─── Constantes de cocina ─────────────────────────────────────────────────────
// Punto de teletransportación (boca del arco de la cocina)
export const KITCHEN_TELEPORT = { x: 830, y: 435 };
// Donde aparece el mesero dentro de la cocina
export const KITCHEN_SPAWN    = { x: 1200, y: 237 };
// Donde reaparece el mesero al salir de la cocina
export const KITCHEN_EXIT     = { x: 760, y: 445 };

// ─── Grafo de navegación ──────────────────────────────────────────────────────
// Ruta extraída pixel a pixel de la imagen anotada (línea roja).
// Todos los nodos están sobre piso libre verificado.
//
//  LAYOUT:
//   R = pasillo horizontal principal  (y ≈ 780)
//   U = sube hacia barra izquierda    (y 780→440)
//   TELEPORT = boca del arco → cocina
//
const NAV_NODES = {
  // Pasillo horizontal  ── izq ←→ der ──
  
  R2: { x:  510, y: 780 },
  R3: { x:  740, y: 780 },
  R4: { x: 1000, y: 780 },
  R5: { x: 1290, y: 780 },
  R6: { x: 1470, y: 790 },
  R7: { x: 1700, y: 780 },

  // Sube hacia zona barra/mostrador izquierdo
 
  U2: { x:  510, y: 720 },
  U3: { x:  1290, y: 640 },

  // Frente al arco de la cocina
  U4: { x:  1140, y: 630 },
  U5: { x:  1140, y: 540 },

  // ⚡ TELEPORT — al llegar aquí el mesero desaparece y aparece en cocina
  TELEPORT: { x: 1140, y: 535 },
};

export { NAV_NODES };

export const NAV_EDGES = {
  R1:  ['R2'],
  R2:  ['R1', 'R3', 'U1', 'U2'],
  R3:  ['R2', 'R4'],
  R4:  ['R3', 'R5'],
  R5:  ['R4', 'R6', 'U3'],
  R6:  ['R5', 'R7'],
  R7:  ['R6'],
  // Sube hacia zona barra/mostrador izquierdo
  U1:  ['R2'],
  U2:       ['R2'],
  U3:       ['R5', 'U4'],
  U4:       ['U3', 'U5'],
  U5:       ['U4', 'TELEPORT'],
  TELEPORT: ['U5'],
};

// ─── A* ───────────────────────────────────────────────────────────────────────
function heuristic(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function findNearestNode(x, y) {
  let best = null, bestDist = Infinity;
  for (const [id, node] of Object.entries(NAV_NODES)) {
    const d = Math.hypot(node.x - x, node.y - y);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

function astar(startId, endId) {
  const open = new Set([startId]);
  const from = {}; const g = { [startId]: 0 };
  const f = { [startId]: heuristic(NAV_NODES[startId], NAV_NODES[endId]) };
  while (open.size > 0) {
    let cur = null, minF = Infinity;
    for (const id of open) { const fv = f[id] ?? Infinity; if (fv < minF) { minF = fv; cur = id; } }
    if (cur === endId) {
      const path = []; let c = cur;
      while (c) { path.unshift(NAV_NODES[c]); c = from[c]; }
      return path;
    }
    open.delete(cur);
    for (const nb of (NAV_EDGES[cur] || [])) {
      if (!NAV_NODES[cur] || !NAV_NODES[nb]) continue; // Validar que los nodos existan
      const gn = (g[cur] ?? Infinity) + heuristic(NAV_NODES[cur], NAV_NODES[nb]);
      if (gn < (g[nb] ?? Infinity)) {
        from[nb] = cur; g[nb] = gn;
        f[nb] = gn + heuristic(NAV_NODES[nb], NAV_NODES[endId]);
        open.add(nb);
      }
    }
  }
  return [];
}

// ─── findPath: construye el path completo ─────────────────────────────────────
function findPath(startX, startY, endX, endY, toKitchen = false) {
  const startNode = findNearestNode(startX, startY);
  const endNode   = toKitchen ? 'TELEPORT' : findNearestNode(endX, endY);

  const graphWaypoints = (startNode && endNode && startNode !== endNode)
    ? astar(startNode, endNode)
    : [];

  const path = [];
  for (const wp of graphWaypoints) {
    const last = path[path.length - 1];
    if (!last || Math.hypot(wp.x - last.x, wp.y - last.y) > 20)
      path.push({ x: wp.x, y: wp.y, isTeleport: (wp === NAV_NODES.TELEPORT) });
  }

  if (!toKitchen) {
    if (!collidesWall(endX, endY)) {
      path.push({ x: endX, y: endY });
    } else {
      for (let r = 20; r <= 120; r += 20) {
        let found = false;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const tx = endX + Math.cos(a) * r, ty = endY + Math.sin(a) * r;
          if (!collidesWall(tx, ty)) { path.push({ x: tx, y: ty }); found = true; break; }
        }
        if (found) break;
      }
    }
  }
  return path;
}

// ─── Posición válida cerca del jugador ───────────────────────────────────────
export function findValidPositionNearPlayer(playerX, playerY, offset = 80) {
  const offs = [
    { dx: offset, dy: 0 }, { dx: -offset, dy: 0 },
    { dx: 0, dy: offset }, { dx: 0, dy: -offset },
    { dx: offset, dy: offset }, { dx: -offset, dy: offset },
    { dx: offset, dy: -offset }, { dx: -offset, dy: -offset },
  ];
  for (const { dx, dy } of offs) {
    const tx = playerX + dx, ty = playerY + dy;
    if (!collidesWall(tx, ty)) return { x: tx, y: ty };
  }
  return { x: playerX, y: playerY };
}

// ─── Player ──────────────────────────────────────────────────────────────────
export class Player {
  constructor(x, y, spriteConfig = SPRITES.player) {
    this.x = x; this.y = y; this.dir = 'down'; this.moving = false;
    this.speed = CONFIG.PLAYER_SPEED; this.frame = 1;
    this.fTimer = 0; this.fSpeed = CONFIG.PLAYER_ANIM_SPEED;
    this.seated = false; this.eating = false; this.eatTimer = 0; this.eatFrame = 0;
    this.spriteConfig = spriteConfig;
  }

  update(mv, emit) {
    if (this.eating) {
      this.eatTimer++;
      if (this.eatTimer % 18 === 0) this.eatFrame = (this.eatFrame + 1) % 4;
      if (this.eatTimer > 200) { this.eating = false; this.eatTimer = 0; emit('eating:done'); }
      return;
    }
    if (this.seated) return;
    const { dx, dy } = mv;
    this.moving = !!(dx || dy);
    if (!this.moving) { this.frame = 1; this.fTimer = 0; return; }
    if (Math.abs(dy) >= Math.abs(dx)) this.dir = dy < 0 ? 'up' : 'down';
    else                               this.dir = dx < 0 ? 'left' : 'right';
    const nx = this.x + dx * this.speed, ny = this.y + dy * this.speed;
    if (!collidesWall(nx, this.y)) this.x = nx;
    if (!collidesWall(this.x, ny)) this.y = ny;
    this.fTimer++;
    if (this.fTimer >= this.fSpeed) { this.fTimer = 0; this.frame = (this.frame + 1) % 4; }
  }

  sitAt(sx, sy)  { this.seated = true; this.x = sx; this.y = sy; this.dir = 'down'; this.frame = 1; }
  stand()        { this.seated = false; }
  startEating()  { this.eating = true; this.eatTimer = 0; this.eatFrame = 0; }
  lookAt(tx, ty) {
    const dx = tx - this.x, dy = ty - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else                              this.dir = dy > 0 ? 'down'  : 'up';
  }
}

// ─── NPC ─────────────────────────────────────────────────────────────────────
export class NPC {
  constructor({ id, x, y, dir = 'down', name }) {
    this.id = id; this.x = x; this.y = y;
    this.startX = x; this.startY = y;
    this.dir = dir; this.name = name;
    this.frame = 0; this.fTimer = 0; this.fSpeed = CONFIG.NPC_ANIM_SPEED;
    this.path = []; this.pathSpeed = 3.2;
    this.onArrived = null; this.visible = true;
    this.animating = false; this._busy = false;
  }

  update() {
    if (this._busy) return;
    const moving = this.path.length > 0;
    if (!moving && !this.animating) { this.frame = 0; this.fTimer = 0; return; }
    this.fTimer++;
    if (this.fTimer >= this.fSpeed) { this.fTimer = 0; this.frame = (this.frame + 1) % 4; }
    if (!moving) return;

    const target = this.path[0];
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Detectar si este waypoint es el punto de teleport
    const isTeleport = target.isTeleport ||
      (Math.abs(target.x - KITCHEN_TELEPORT.x) < 15 &&
       Math.abs(target.y - KITCHEN_TELEPORT.y) < 15);

    if (dist < 6 || (isTeleport && dist < 50)) {
      this.x = target.x; this.y = target.y;
      this.path.shift();

      if (isTeleport) {
        // ⚡ Teleportar a la cocina
        this._busy = true;
        this.visible = false;
        setTimeout(() => {
          this.x = KITCHEN_SPAWN.x; this.y = KITCHEN_SPAWN.y;
          this.dir = 'down'; this.visible = true; this._busy = false;
          if (this.path.length === 0 && this.onArrived) {
            const cb = this.onArrived; this.onArrived = null;
            setTimeout(cb, 80);
          }
        }, 250);
        return;
      }

      if (this.path.length === 0 && this.onArrived) {
        const cb = this.onArrived; this.onArrived = null;
        setTimeout(cb, 80);
      }
      return;
    }

    const spd = Math.min(this.pathSpeed, dist);
    const nx = this.x + (dx / dist) * spd, ny = this.y + (dy / dist) * spd;
    if (!collidesWall(nx, this.y)) this.x = nx;
    if (!collidesWall(this.x, ny)) this.y = ny;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else                              this.dir = dy > 0 ? 'down'  : 'up';
  }

  // Caminar a cualquier punto usando A*
  walkTo(x, y, cb) {
    this.path = findPath(this.x, this.y, x, y, false);
    this.onArrived = cb || null;
  }

  // Ir a la cocina vía teleport
  walkToKitchen(cb) {
    this.path = findPath(this.x, this.y, KITCHEN_SPAWN.x, KITCHEN_SPAWN.y, true);
    this.onArrived = cb || null;
  }

  // Salir de la cocina: aparece en la boca del arco
  exitKitchen(cb) {
    this._busy = true;
    this.visible = false;
    setTimeout(() => {
      this.x = KITCHEN_EXIT.x; this.y = KITCHEN_EXIT.y;
      this.dir = 'down'; this.visible = true; this._busy = false;
      if (cb) setTimeout(cb, 80);
    }, 250);
  }

  returnToPost() { this.walkTo(this.startX, this.startY); }

  isNearPlayer(player) {
    const near = (
      Math.abs(this.x - player.x) < CONFIG.INTERACT_RADIUS &&
      Math.abs(this.y - player.y) < CONFIG.INTERACT_RADIUS
    );
    this.animating = near;
    return near;
  }
}

// ─── Chef ─────────────────────────────────────────────────────────────────────
export class Chef {
  constructor() {
    this.x = CHEF_POS.x; this.y = CHEF_POS.y;
    this.dir = 'down'; this.frame = 0; this.fTimer = 0; this.fSpeed = 20;
    this.visible = true; this.animating = false;
  }

  update() {
    if (!this.animating) { this.frame = 0; return; }
    this.fTimer++;
    if (this.fTimer >= this.fSpeed) { this.fTimer = 0; this.frame = (this.frame + 1) % 4; }
  }

  isNearPlayer(player) {
    const near = Math.abs(player.x - CHEF_POS.x) < 140 && Math.abs(player.y - CHEF_POS.y) < 140;
    this.animating = near;
    return near;
  }
}

// ─── Silla más cercana al jugador ────────────────────────────────────────────
export function findNearSeat(player) {
  return SEATS.find(
    s => Math.abs(s.x - player.x) < 38 && Math.abs(s.y - player.y) < 38
  ) || null;
}