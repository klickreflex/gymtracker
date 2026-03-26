import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Stamp the service worker with the current version after build
function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve('dist/sw.js');
      const content = readFileSync(swPath, 'utf-8');
      writeFileSync(swPath, content.replace('__SW_VERSION__', pkg.version));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), swVersionPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    assetsInlineLimit: 0,
  },
})
