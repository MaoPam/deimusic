// Reproductor simulado en memoria.
// Implementa exactamente la misma interfaz que el cliente real (services/player.js),
// así que la UI no sabe si detrás hay una Raspberry o este archivo.
// Sirve para desarrollar y para que el repo se pueda ver sin el hardware.

import { CATALOG, toSecs } from './catalog.js';
import { createStore, EMPTY_STATE } from '../services/playerStore.js';

const TICK_MS = 1000;
const LATENCIA_BUSQUEDA_MS = 350; // simula la red para que se vea el skeleton de carga
const LATENCIA_ENCOLAR_MS = 200;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export const createDemoPlayer = () => {
  const [primera, ...resto] = CATALOG;

  const store = createStore({
    ...EMPTY_STATE,
    connected: true,
    current: primera,
    queue: resto,
    is_playing: true,
    duration_secs: toSecs(primera.duration),
    status_msg: 'Modo demo · reproducción simulada',
  });

  const historial = [];
  let timer = null;

  const reproducir = (track, queue) => {
    store.setState({
      current: track ?? null,
      queue,
      is_playing: Boolean(track),
      elapsed_secs: 0,
      duration_secs: toSecs(track?.duration),
      progress: 0,
    });
  };

  const siguiente = () => {
    const { current, queue } = store.getState();
    if (current) historial.push(current);
    const [next, ...pendientes] = queue;
    reproducir(next ?? null, pendientes);
  };

  const anterior = () => {
    const { current, queue, elapsed_secs } = store.getState();
    // Como en cualquier reproductor: si ya avanzó, "anterior" reinicia la canción.
    if (elapsed_secs > 3 || historial.length === 0) {
      store.setState({ elapsed_secs: 0, progress: 0 });
      return;
    }
    reproducir(historial.pop(), current ? [current, ...queue] : queue);
  };

  const tick = () => {
    const { is_playing, current, elapsed_secs, duration_secs } = store.getState();
    if (!is_playing || !current) return;

    const elapsed = elapsed_secs + 1;
    if (duration_secs > 0 && elapsed >= duration_secs) {
      siguiente();
      return;
    }
    store.setState({
      elapsed_secs: elapsed,
      progress: duration_secs > 0 ? elapsed / duration_secs : 0,
    });
  };

  return {
    getState: store.getState,

    subscribe(listener) {
      const unsubscribe = store.subscribe(listener);
      if (!timer) timer = setInterval(tick, TICK_MS);
      return () => {
        unsubscribe();
        if (store.listenerCount() === 0) {
          clearInterval(timer);
          timer = null;
        }
      };
    },

    async command(name, body = {}) {
      const { current, queue } = store.getState();

      switch (name) {
        case 'pause':
          store.setState({ is_playing: false });
          break;
        case 'resume':
          store.setState({ is_playing: Boolean(current) });
          break;
        case 'stop':
          store.setState({ is_playing: false, elapsed_secs: 0, progress: 0 });
          break;
        case 'skip':
          siguiente();
          break;
        case 'prev':
          anterior();
          break;
        case 'play_at': {
          const elegida = queue[body.index];
          if (!elegida) break;
          if (current) historial.push(current);
          reproducir(elegida, queue.filter((_, i) => i !== body.index));
          break;
        }
        case 'remove':
          store.setState({ queue: queue.filter((_, i) => i !== body.index) });
          break;
        case 'move': {
          const next = [...queue];
          const [item] = next.splice(body.from, 1);
          next.splice(body.to, 0, item);
          store.setState({ queue: next });
          break;
        }
        default:
          break;
      }
    },

    async search(query) {
      await espera(LATENCIA_BUSQUEDA_MS);
      const q = query.trim().toLowerCase();
      const coincidencias = CATALOG.filter(({ title, artist, album }) =>
        `${title} ${artist} ${album}`.toLowerCase().includes(q),
      );
      // Si no hay coincidencias se devuelve todo el catálogo: en demo siempre
      // tiene que haber algo que encolar.
      return coincidencias.length > 0 ? coincidencias : CATALOG;
    },

    async enqueue(track) {
      await espera(LATENCIA_ENCOLAR_MS);
      const { current, queue } = store.getState();
      if (!current) reproducir(track, queue);
      else store.setState({ queue: [...queue, track] });
    },
  };
};
