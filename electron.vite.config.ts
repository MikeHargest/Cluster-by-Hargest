import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      // electron-store and conf must NOT be externalized — they use CJS and need bundling
      externalizeDeps: { exclude: ['electron-store', 'conf'] }
    }
  },
  preload: {},
  renderer: {
    server: {
      host: '127.0.0.1',
      port: 5173
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
