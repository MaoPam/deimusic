import { useSyncExternalStore } from 'react';
import { player } from '../services/player.js';

// Estado del reproductor, vivo. Todos los componentes que lo usan comparten
// la misma suscripción (y, en modo real, la misma conexión WebSocket).
export const usePlayerState = () =>
  useSyncExternalStore(player.subscribe, player.getState, player.getState);
