# DeiMusic — front-end de una jukebox colaborativa

Interfaz web para una jukebox montada sobre una Raspberry Pi: en una fiesta, cualquiera entra desde su móvil, busca una canción y la deja en la cola compartida que suena en el equipo, sin tener que pedirle a nadie que cambie de música.

> **Qué hice yo: el front-end completo.** Este repositorio contiene solo mi parte.
> El backend en Rust, el microservicio de metadatos en Python y el montaje sobre la Raspberry Pi son de [@Deiruwu](https://github.com/Deiruwu), en el proyecto original [jukebox_pi_party](https://github.com/Deiruwu/jukebox_pi_party). Yo me encargué de toda la interfaz y de su integración con la API (REST + WebSocket).

**Arranca sin hardware:** `npm install && npm run dev` levanta la app en modo demo con un reproductor simulado. No necesitas Raspberry Pi ni backend.

---

## Captura

<!-- TODO: sustituir por un GIF de ~10 s: buscar una canción → encolarla → reordenar la cola arrastrando → play/pause -->
<!-- Grábalo con ScreenToGif y guárdalo en docs/demo.gif -->

![Demo de DeiMusic](docs/demo.gif)

---

## Stack

- **React 19** + **Vite 7** (JavaScript)
- **Tailwind CSS 3**
- **lucide-react** para iconos
- **WebSocket** nativo para el estado en tiempo real y **fetch** para los comandos REST
- **Canvas API** para el fondo animado de partículas

Sin librerías de estado ni de drag & drop: las dos cosas están resueltas a mano.

---

## Lo técnicamente difícil

**1. Un solo estado en tiempo real para toda la app.**
El backend empuja el estado del reproductor (canción actual, cola, segundos transcurridos) por WebSocket en cada cambio. En la primera versión, cada componente que necesitaba ese estado abría su propia conexión con su propia lógica de reconexión: dos sockets contra la misma Raspberry, estados que se desincronizaban entre sí y conexiones que quedaban abiertas al desmontar.

Lo resolví con un store de suscripción propio ([`src/services/playerStore.js`](src/services/playerStore.js)) que los componentes consumen con `useSyncExternalStore`. La conexión se abre con el primer suscriptor y se cierra con el último: **una sola conexión**, escuchen los componentes que escuchen.

**2. El WebSocket empuja cambios, no el estado actual.**
Si abrías la página con una canción ya sonando, la interfaz se quedaba vacía hasta el siguiente evento. La solución fue pedir el estado inicial por REST (`GET /api/current` + `GET /api/queue`) y abrir el socket después, que a partir de ahí manda los cambios. Si el socket se cae, reintenta cada 2 s y la barra del reproductor muestra el estado de la conexión con un punto de color.

**3. Reordenar la cola arrastrando, sin librerías.**
Usé la API nativa de drag & drop de HTML5. El problema no fue arrastrar, sino el parpadeo: al soltar, la lista volvía al orden anterior durante el viaje de ida y vuelta al servidor. Lo arreglé con una actualización optimista: el front reordena su copia local al instante, manda `POST /api/move` y se resincroniza cuando llega el siguiente push del servidor.

**4. Desarrollar una UI de reproductor sin tener el hardware delante.**
Toda la comunicación pasa por un único módulo ([`src/services/player.js`](src/services/player.js)) con una interfaz cerrada: `subscribe`, `command`, `search`, `enqueue`. Eso me permitió escribir una segunda implementación, [`src/mocks/demoPlayer.js`](src/mocks/demoPlayer.js), que simula el reproductor en memoria: avanza el tiempo, encadena canciones, responde a play/pause/skip/reordenar y devuelve resultados de búsqueda con latencia falsa para que se vea el estado de carga. **La UI no sabe cuál de las dos está usando.** Es lo que hace que este repositorio se pueda abrir y ver funcionando sin la Raspberry Pi.

---

## Instalación y ejecución

Requisitos: **Node.js 20 o superior** (incluye npm) y git.

```bash
# 1. Clonar
git clone https://github.com/MaoPam/deimusic.git
cd deimusic

# 2. Instalar dependencias
npm install

# 3. Arrancar
npm run dev
```

Abre **http://localhost:5173**. Arranca en **modo demo**: reproductor simulado, cuatro canciones de ejemplo y buscador funcionando, sin backend.

### Conectarlo al reproductor real

Con el backend en Rust corriendo en la Raspberry Pi (puerto 3000), crea un archivo `.env.local` a partir de [`.env.example`](.env.example):

```bash
VITE_DEMO=false
VITE_BACKEND=http://IP-DE-TU-RASPBERRY:3000
```

Y vuelve a lanzar `npm run dev`. Vite arranca con `host: true`, así que también puedes abrir la app desde el móvil usando la IP de tu ordenador en la misma red.

### Otros comandos

```bash
npm run build     # build de producción en dist/
npm run preview   # sirve el build para revisarlo
npm run lint      # ESLint
```

---

## Estructura

```
src/
├── App.jsx                 Layout: cabecera, cola, barra del reproductor y modal
├── config.js               Variables de entorno (API y modo demo)
├── components/
│   ├── Busqueda.jsx        Barra de búsqueda
│   ├── busquedaM.jsx       Modal de resultados + toast de confirmación
│   ├── Playlist.jsx        Cola con drag & drop y "sonando ahora"
│   ├── PlayerBar.jsx       Barra inferior: controles, progreso y estado de conexión
│   └── fondo.jsx           Fondo de partículas en canvas
├── hooks/
│   ├── usePlayerState.js   Suscripción al estado del reproductor
│   ├── usePlay.js          Cola y lógica de drag & drop
│   └── useSearch.js        Búsqueda, encolado y toasts
├── services/
│   ├── player.js           Cliente real (REST + WebSocket) y selector demo/real
│   └── playerStore.js      Store de suscripción compartido
└── mocks/
    ├── demoPlayer.js       Reproductor simulado (misma interfaz que el real)
    └── catalog.js          Canciones de ejemplo del modo demo
```

---

## API que consume

Contrato definido por el backend del proyecto original (Rust + Axum):

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/api/results?query=` | Buscar sin encolar |
| `POST` | `/api/search` | Encolar por id — `{ "query": "..." }` |
| `GET` | `/api/current` | Canción actual y progreso |
| `GET` | `/api/queue` | Cola pendiente |
| `POST` | `/api/pause` · `/resume` · `/stop` · `/skip` · `/prev` | Controles |
| `POST` | `/api/play_at` · `/api/remove` | `{ "index": n }` |
| `POST` | `/api/move` | `{ "from": n, "to": n }` |
| `WS` | `/ws` | Push del estado del reproductor en cada cambio |

---

## Sobre el modo demo

Las cuatro canciones del catálogo de ejemplo (Bad Gyal, Métrika, Villano Antillano) existen de verdad, pero **álbum, duración y portadas son datos de relleno**: las portadas son SVG generados en el propio código y no hay audio ni peticiones a servicios externos. El modo demo simula el comportamiento del reproductor; no reproduce música.

---

## Licencia

[MIT](LICENSE) — código del front-end. El proyecto completo (backend, hardware) pertenece a su autoría original.
