import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        simple: resolve(__dirname, 'simple-project/index.html'),
        overlay: resolve(__dirname, 'biggame-ending/overlay.html'),
        control: resolve(__dirname, 'biggame-ending/control.html')
      }
    }
  }
})
