// Base de la API. En dev el proxy de Vite (vite.config.js) la redirige a la Raspberry.
export const API = import.meta.env.VITE_API_URL ?? '/api';

// Modo demo: reproductor simulado en memoria, sin backend ni Raspberry.
// Activo por defecto para que el repo se pueda abrir y ver sin hardware.
// Para conectarlo al equipo real: VITE_DEMO=false en .env.local
export const DEMO = import.meta.env.VITE_DEMO !== 'false';

export const CONFIG = { API, DEMO };
