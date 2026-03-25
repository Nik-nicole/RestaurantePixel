// ─── Configuración global del juego ─────────────────────────────────────────

export const GAME_STATE = {
  FREE: 'free', SITTING: 'sitting', ORDERING: 'ordering',
  WAITER_GOING: 'waiter_going', COOKING: 'cooking', SERVING: 'serving',
  EATING: 'eating', EATING_DONE: 'eating_done', BILL: 'bill', PAYING: 'paying',
};

export const CONFIG = {
  MAP_W:  2000,
  MAP_H:  1500,
  VIEW_W:  1400,
  VIEW_H:  900,
  ZOOM:    1,
  PLAYER_SPEED:      5.0,
  PLAYER_ANIM_SPEED: 6,
  PLAYER_COLLIDER:   14,
  INTERACT_RADIUS:   75,
  NPC_ANIM_SPEED:    22,
};

// ─── Spritesheets ─────────────────────────────────────────────────────────────
export const SPEAKER_META = {
  player: { name: 'TÚ',           color: '#000000', sprKey: 'player' },
  waiter: { name: 'MESERA LAURA', color: '#000000', sprKey: 'waiterB' },
  chef:   { name: 'CHEF MARCO',   color: '#000000', sprKey: 'waiter' },
};

export const SPRITES = {
  player2: {
    gridX: 25.3, gridY: 10.7,
    cellW: 202.6,
    cellH: 316,
    scale: 0.4,
    dirRow: { down: 0, left: 1, right: 2, up: 3 },
},
  player: {
    gridX: 25, gridY: 38,
    cellW: 58, cellH: 89,
    scale: 1.2,
    dirRow: { down:0, left:1, right:2, up:3 },
  },
  waiter: {
   gridX: 0, gridY: 2,
    cellW: 97, cellH: 135,
    scale: 0.82,
    dirRow: { down:0, left:1, right:2, up:3 },
  },
  chef: {
    gridX: 0,    // spritesheet cheff.png empieza desde x=0
    gridY: 0,    // spritesheet cheff.png empieza desde y=0
    cellW: 102,  // 408px / 4 columnas
    cellH: 152,  // 611px / 4 filas
    scale: 0.85, // más grande que waiter → ~87x129px en pantalla
    dirRow: { down:0, left:1, right:2, up:3 },
  },
};

// ─── PAREDES Y COLISIONES ─────────────────────────────────────────────────────
// Solo paredes exteriores y estructurales principales (sin mesas ni sillas)
export const WALLS = [
  // Bordes negros exteriores
  { x:    0, y:    0, w: 2000, h:   63 },
  { x:    0, y: 1412, w: 2000, h:   88 },
  { x:    0, y:    0, w:   55, h: 1500 },
  { x: 1881, y:    0, w:  119, h: 1500 },
  
  // Paredes de la cocina (estructura principal)
  { x: 1585, y:  231, w:  31, h:  10 },
  { x: 1111, y:  257, w:  31, h:  45 },
  { x: 1138, y:  266, w:  64, h:  12 },
  { x: 1198, y:  264, w:  64, h:  12 },
  { x: 1258, y:  264, w:  64, h:  12 },
  { x: 1318, y:  264, w:  64, h:  12 },
  { x: 1378, y:  264, w:  64, h:  12 },
  { x: 1438, y:  264, w:  64, h:  12 },
  { x: 1498, y:  253, w:  62, h:  21 },
  { x: 1572, y:  237, w:  44, h:  35 },
  { x: 1630, y:  286, w:  52, h:  10 },
  { x: 1678, y:  282, w:  64, h:  14 },
  { x: 1738, y:  259, w:  58, h:  41 },
  
  // Barras y mostradores principales
  { x: 1111, y:  298, w:  12, h:  64 },
  { x: 1262, y:  325, w:  60, h:  37 },
  { x: 1324, y:  315, w:  58, h:  47 },
  { x: 1378, y:  317, w:  64, h:  45 },
  { x: 1438, y:  319, w:  64, h:  43 },
  { x: 1498, y:  319, w:  64, h:  43 },
  { x: 1558, y:  317, w:  25, h:  43 },
  
  // Algunas paredes interiores importantes (para mantener estructura)
  //pared 1
  { x:  120, y:  580, w:  1000, h:  10 },
  { x:  90, y:  580, w:  20, h:  1000 },
  //mesa 1
  { x:  238,  y:690, r:48, type: "circle" },
  //mesa 3
  { x: 1560, y:  630, w:  190, h:  90 },

  //mostrador
  { x:  610, y:  676, w:  630, h:  80 },
  { x:  610, y:  580, w:  60, h:  100 },
  { x:  730, y:  580, w:  340, h:  40 },

  //pared 2
  { x:  1200, y:  580, w:  670, h:  10 },
  { x:  120, y:  580, w:  1000, h:  10 },
  { x: 1414, y:  590, w:  45, h:  180 },

  //mesas del centro : 1 
  { x:  604,  y:910, r:55, type: "circle" },
  //mesas del centro : 2 
  { x:  867,  y:910, r:49, type: "circle" },
  //mesas del centro : 3 
  { x:  1236,  y:910, r:49, type: "circle" },
  //mesas del centro : 3 
  { x:  1512,  y:910, r:49, type: "circle" },

  //muros 
  { x:  487, y: 110, w:  1190, h:  10 },
  { x:  487, y: 1100, w:  1190, h:  10 },
  { x:  447, y: 1100, w:  68, h:  400 },

{ x:  120, y:  820, w: 80, h:  600 },

{ x:1100, y:  340, w: 20, h:  230 },

{ x:  1200, y:  420, w:  670, h:  10 },
{ x:  1200, y:  420, w:  70, h:  200 },

{ x:  1800, y: 200, w:  70, h:  70 },

 { x:  1670, y: 1110, w:  300, h:  100 },

 { x:  1790, y: 780, w:  100, h:  300 },

];

// ─── Sillas / asientos ────────────────────────────────────────────────────────
// Centro exacto del cojín de cada silla — el jugador se posa ENCIMA al presionar E
export const SEATS = [
  // Mesa 1 (izquierda) - 4 sillas
  { id:'s1',  x: 216, y: 632, tableId:'t1' },
  { id:'s2',  x: 268, y: 632, tableId:'t1' },
  { id:'s3',  x: 216, y: 680, tableId:'t1' },
  { id:'s4',  x: 268, y: 680, tableId:'t1' },
  
  // Mesa 2 (derecha) - 4 sillas
  { id:'s5',  x: 1512, y: 860, tableId:'t2' },
  { id:'s6',  x: 1564, y: 860, tableId:'t2' },
  { id:'s7',  x: 1512, y: 908, tableId:'t2' },
  { id:'s8',  x: 1564, y: 908, tableId:'t2' },

  // Mesa adicional
  { id:'s9',  x: 664, y: 608, tableId:'t3' },

  // Mesas circulares del centro - 4 sillas cada una
  // Mesa centro 1 (radio 55)
  { id:'s10', x: 604,  y: 855, tableId:'t4' }, // arriba
  { id:'s11', x: 659,  y: 910, tableId:'t4' }, // derecha  
  { id:'s12', x: 604,  y: 965, tableId:'t4' }, // abajo
  { id:'s13', x: 549,  y: 910, tableId:'t4' }, // izquierda

  // Mesa centro 2 (radio 49)
  { id:'s14', x: 867,  y: 861, tableId:'t5' }, // arriba
  { id:'s15', x: 916,  y: 910, tableId:'t5' }, // derecha
  { id:'s16', x: 867,  y: 959, tableId:'t5' }, // abajo  
  { id:'s17', x: 818,  y: 910, tableId:'t5' }, // izquierda

  // Mesa centro 3 (radio 49)
  { id:'s18', x: 1236, y: 861, tableId:'t6' }, // arriba
  { id:'s19', x: 1285, y: 910, tableId:'t6' }, // derecha
  { id:'s20', x: 1236, y: 959, tableId:'t6' }, // abajo
  { id:'s21', x: 1187, y: 910, tableId:'t6' }, // izquierda
];

// ─── Chef ─────────────────────────────────────────────────────────────────────
export const CHEF_POS = { x: 1374, y: 300 };

// ─── NPCs iniciales ───────────────────────────────────────────────────────────
export const NPC_START = [
  { id:'waiter1', x: 510, y: 720, dir:'down', name:'MESERO CARLOS' },  // U2
  { id:'waiter2', x: 1290, y: 640, dir:'down', name:'MESERA LAURA'  }, // U3
];

// ─── Jugador — puerta de entrada ─────────────────────────────────────────────
export const PLAYER_START = { x: 285, y: 1365 };

// ─── Menú del restaurante ─────────────────────────────────────────────────────
export const MENU_ITEMS = [
  { id:'burger', name:'Hamburguesa',  price:12500, emoji:'🍔', src: './assets/haburguesa.png' },
  { id:'pizza',  name:'Pizza',        price:18900, emoji:'🍕', foodCol:0, foodRow:8 },
  { id:'pasta',  name:'Pasta',        price:15000, emoji:'🍝', foodCol:5, foodRow:5 },
  { id:'soup',   name:'Sopa del día', price:8500,  emoji:'🍲', foodCol:3, foodRow:3 },
  { id:'salad',  name:'Ensalada',     price:9800,  emoji:'🥗', foodCol:6, foodRow:3 },
  { id:'steak',  name:'Bistec',       price:22000, emoji:'🥩', foodCol:2, foodRow:6 },
  { id:'coffee', name:'Café',         price:3800,  emoji:'☕', foodCol:0, foodRow:0 },
  { id:'juice',  name:'Jugo natural', price:4500,  emoji:'🧃', foodCol:9, foodRow:4 },
  { id:'cake',   name:'Pastel',       price:7200,  emoji:'🎂', foodCol:9, foodRow:7 },
  { id:'fries',  name:'Papas fritas', price:6000,  emoji:'🍟', foodCol:3, foodRow:4 },
];

// ─── Diálogos ─────────────────────────────────────────────────────────────────
export const DIALOGS = {
  seat_request: [
    { speaker:'waiter', text:'¡Hola! Bienvenido al Restaurante Pixel. 🍽️' },
    { speaker:'waiter', text:'Por favor, siéntate y te atenderé enseguida con nuestro menú.' },
    { speaker:'waiter', text:'Tenemos hamburguesas, pizza, pasta y mucho más. ¡Todo delicioso!' },
  ],
  waiter_approach: [
    { speaker:'waiter', text:'¡Buenas tardes! Bienvenido al Restaurante Pixel. ¿Listo para ordenar?' },
    { speaker:'waiter', text:'Aquí tiene nuestro menú. ¡Todo está delicioso hoy!' },
  ],
  waiter_confirm: (items) => [
    { speaker:'waiter', text:`Perfecto, entonces: ${items}. ¿Confirma su pedido?` },
  ],
  waiter_toKitchen: [
    { speaker:'waiter', text:'¡Excelente elección! Enseguida le llevo su pedido a la cocina.' },
  ],
  waiter_serving: [
    { speaker:'waiter', text:'¡Aquí está su pedido! Que lo disfrute mucho. 😊' },
  ],
  chef_busy: [
    { speaker:'chef', text:'¡Recibido! Preparando su pedido con mucho amor. 👨‍🍳' },
    { speaker:'chef', text:'Usaré los mejores ingredientes. ¡En unos momentos estará listo!' },
  ],
  order_ready: [
    { speaker:'waiter', text:'¡Su pedido ya está listo! 🍽️' },
    { speaker:'waiter', text:'¿Podemos traérselo ahora?' },
  ],
  order_response: [
    { speaker:'waiter', text:'¡Perfecto! Enseguida se lo traigo. 😊' },
  ],
  order_cancel: [
    { speaker:'waiter', text:'¡Ah, no hay problema! Quizás en otro momento.' },
    { speaker:'waiter', text:'Si necesitas algo más, avísame. 👋' },
  ],
  bill_question: [
    { speaker:'waiter', text:'¿Cómo desea pagar su cuenta?' },
  ],
  pay_card: [
    { speaker:'waiter', text:'Por favor acerque su tarjeta al datáfono... 💳' },
    { speaker:'waiter', text:'¡Pago aprobado! Le enviamos el comprobante a su celular.' },
  ],
  pay_cash: (change) => [
    { speaker:'waiter', text:`Su cambio es $${change.toLocaleString('es-CO')}. ¡Gracias!` },
    { speaker:'waiter', text:'¡Le enviamos su factura al celular! Esperamos verle pronto.' },
  ],
  goodbye: [
    { speaker:'waiter', text:'¡Fue un placer atenderle! Vuelva pronto. 👋' },
  ],
  chef_hello: [
    { speaker:'chef', text:'¡Hola! Soy el chef Marco. ¿Le gustó la comida?' },
    { speaker:'chef', text:'Todo lo preparamos con ingredientes frescos del día.' },
    { speaker:'chef', text:'¡Esperamos verle de nuevo! 👨‍🍳' },
  ],
};