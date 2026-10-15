import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { hubManifest } from './src/ring.js'

const registryPath = fileURLToPath(new URL('./registry.json', import.meta.url))
const manifest = () => JSON.stringify(hubManifest(JSON.parse(readFileSync(registryPath, 'utf8'))), null, 2)

// The square's manifest is generated from the registry, so its portals always match the ring:
// served live by the dev server, and written to dist/.well-known/metaverse.json on build.
function squareManifest() {
  return {
    name: 'square-manifest',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.split('?')[0] !== '/.well-known/metaverse.json') return next()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(manifest())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.well-known/metaverse.json', source: manifest() })
    },
  }
}

export default defineConfig({
  base: './', // relative paths so it works on GitHub Pages and locally
  plugins: [react(), squareManifest()],
  // 5173 Yale, 5174 Darul Kebab, 5175 the Metaverse Browser, 5176 the starter world (5177 is taken on this machine)
  server: { port: 5178, strictPort: true },
})
