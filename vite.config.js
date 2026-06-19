import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        timer: resolve(__dirname, 'wood-timer/index.html'),
        staff: resolve(__dirname, 'wood-timer/staff.html'),
        overlay: resolve(__dirname, 'biggame-ending/overlay.html'),
        control: resolve(__dirname, 'biggame-ending/control.html')
      }
    }
  }
})
