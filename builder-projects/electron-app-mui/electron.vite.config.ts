import { resolve } from 'path'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'electron-vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()]
  }
})
