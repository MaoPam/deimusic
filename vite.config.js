import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// El proxy solo se usa cuando VITE_DEMO=false (front conectado a la Raspberry).
// La dirección del equipo se define en .env.local, no se versiona.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendHttp = env.VITE_BACKEND ?? 'http://localhost:3000'
  const backendWs = backendHttp.replace(/^http/, 'ws')

  return {
    plugins: [react()],
    server: {
      host: true, // accesible desde el móvil en la misma red
      proxy: {
        '/api': { target: backendHttp, changeOrigin: true },
        '/ws': { target: backendWs, ws: true, changeOrigin: true },
      },
    },
  }
})
