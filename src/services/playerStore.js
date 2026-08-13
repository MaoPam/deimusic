// Estado del reproductor, con la misma forma que el `PlayerState` que emite el
// backend por WebSocket. `connected` es lo único que añade el front.
export const EMPTY_STATE = {
  current: null,
  queue: [],
  is_playing: false,
  progress: 0,
  elapsed_secs: 0,
  duration_secs: 0,
  status_msg: null,
  connected: false,
};

// Store mínimo de suscripción: una sola fuente de verdad que varios componentes
// pueden escuchar sin abrir cada uno su propia conexión.
export const createStore = (initial = EMPTY_STATE) => {
  let state = initial;
  const listeners = new Set();

  return {
    getState: () => state,
    setState(patch) {
      state = { ...state, ...patch };
      listeners.forEach((l) => l(state));
    },
    listenerCount: () => listeners.size,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
};
