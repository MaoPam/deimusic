// Único punto de contacto con el backend.
// La UI habla siempre con `player`; detrás puede estar la Raspberry (cliente real)
// o el reproductor simulado (mocks/demoPlayer.js) según CONFIG.DEMO.
//
// Interfaz:
//   getState()            -> PlayerState
//   subscribe(cb)         -> unsubscribe   (cb recibe el estado en cada cambio)
//   command(name, body)   -> pause | resume | stop | skip | prev | play_at | remove | move
//   search(query)         -> Promise<Track[]>
//   enqueue(track)        -> Promise<void>

import { CONFIG } from '../config.js';
import { createStore, EMPTY_STATE } from './playerStore.js';
import { createDemoPlayer } from '../mocks/demoPlayer.js';

const RECONEXION_MS = 2000;

const createLivePlayer = () => {
  const store = createStore(EMPTY_STATE);
  let ws = null;
  let reintento = null;

  const conectar = () => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${window.location.host}/ws`);

    ws.onopen = () => store.setState({ connected: true });
    ws.onmessage = (e) => {
      try {
        store.setState(JSON.parse(e.data));
      } catch {
        // frame corrupto: se ignora, el siguiente push corrige el estado
      }
    };
    ws.onclose = () => {
      ws = null;
      store.setState({ connected: false });
      // Solo se reintenta si queda alguien escuchando.
      if (store.listenerCount() > 0) reintento = setTimeout(conectar, RECONEXION_MS);
    };
  };

  // Snapshot inicial por REST: el WebSocket solo empuja cambios, no el estado actual.
  const arrancar = async () => {
    try {
      const [cr, qr] = await Promise.all([
        fetch(`${CONFIG.API}/current`),
        fetch(`${CONFIG.API}/queue`),
      ]);
      const patch = {};
      if (cr.ok) Object.assign(patch, await cr.json());
      if (qr.ok) patch.queue = (await qr.json()) ?? [];
      store.setState(patch);
    } catch {
      // sin backend arriba el WebSocket seguirá reintentando
    }
    conectar();
  };

  const detener = () => {
    clearTimeout(reintento);
    reintento = null;
    if (ws) {
      ws.onclose = null; // evita programar una reconexión al cerrar a propósito
      ws.close();
      ws = null;
    }
  };

  return {
    getState: store.getState,

    // La conexión se abre con el primer suscriptor y se cierra con el último:
    // una sola conexión para toda la app, la abran los componentes que la abran.
    subscribe(listener) {
      const unsubscribe = store.subscribe(listener);
      if (store.listenerCount() === 1) arrancar();
      return () => {
        unsubscribe();
        if (store.listenerCount() === 0) detener();
      };
    },

    async command(name, body) {
      await fetch(`${CONFIG.API}/${name}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    async search(query) {
      const r = await fetch(`${CONFIG.API}/results?query=${encodeURIComponent(query)}`);
      if (!r.ok) throw new Error(`Búsqueda fallida (${r.status})`);
      return r.json();
    },

    async enqueue(track) {
      const r = await fetch(`${CONFIG.API}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: track.id }),
      });
      if (!r.ok) throw new Error(`No se pudo encolar (${r.status})`);
    },
  };
};

export const player = CONFIG.DEMO ? createDemoPlayer() : createLivePlayer();
