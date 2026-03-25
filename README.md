# 🍽 Pixel Restaurant RPG — React

Simulador de restaurante en pixel art construido con React + Vite + Canvas.

---

## 🚀 Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar servidor de desarrollo
npm run dev

# 3. Build para producción
npm run build
```

---

## 🖼 Imágenes requeridas

Copia tus 4 imágenes a `src/assets/` con estos nombres exactos:

| Archivo             | Descripción                        |
|---------------------|------------------------------------|
| `src/assets/map.jpg`    | Fondo del restaurante (1024×768)   |
| `src/assets/player.jpg` | Spritesheet del jugador (474×474)  |
| `src/assets/waiter.jpg` | Spritesheet del mesero (750×750)   |
| `src/assets/food.jpg`   | Iconos de comida (grilla 10×11)    |

---

## 📁 Estructura del proyecto

```
src/
├── main.jsx               # Entrada de React
├── App.jsx                # Componente raíz
├── index.css              # Todos los estilos
│
├── assets/                # ← Tus imágenes aquí
│   ├── map.jpg
│   ├── player.jpg
│   ├── waiter.jpg
│   └── food.jpg
│
├── game/                  # Lógica del juego (sin React)
│   ├── config.js          # Constantes, seats, menú, diálogos
│   ├── entities.js        # Clases Player, NPC, Chef
│   ├── renderer.js        # Dibujado puro en canvas
│   └── useGameLoop.js     # Hook principal — loop + estado
│
├── hooks/
│   └── useAssets.js       # Carga imágenes con progreso
│
└── components/
    ├── LoadingScreen.jsx
    ├── TitleScreen.jsx
    ├── HUD.jsx
    ├── DialogBox.jsx      # Diálogos con retrato del personaje
    ├── MenuOverlay.jsx    # Menú de comida con iconos pixel art
    ├── YesNoOverlay.jsx   # Confirmación sí/no
    └── PaymentOverlay.jsx # Pago tarjeta/efectivo + notif celular
```

---

## 🎮 Controles

| Tecla              | Acción                  |
|--------------------|-------------------------|
| `↑ ↓ ← →` / `WASD` | Mover al personaje     |
| `E` / `Espacio`    | Interactuar / avanzar diálogo |

---

## 🔄 Flujo del juego

```
Explorar → Sentarse en silla → Mesero se acerca
→ Menú → Confirmar pedido → Mesero va a cocina
→ Chef cocina → Mesero trae comida → Animación comer
→ Pedir cuenta → Elegir pago → Notificación celular
```

---

## 🧩 Arquitectura

- **`useGameLoop`** — hook central que mantiene toda la lógica de juego usando `useRef` para entidades mutables (sin re-renders por frame) y `useState` solo para cambios de UI.
- **`renderer.js`** — función pura `drawFrame(ctx, ...)` sin dependencias del DOM. Fácil de testear.
- **`entities.js`** — clases puras Player/NPC/Chef con método `update()`. No saben nada de React.
- Los componentes React solo muestran UI (diálogos, menús, pagos) — el canvas se maneja directamente.
