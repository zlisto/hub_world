import { createRoot } from 'react-dom/client'
import { loadRegistry } from './registry.js'
import { initLayout } from './layout.js'
import './styles.css'

// read the registry first (it decides the ring and the spawn points), then start the square
loadRegistry().then(async (registry) => {
  initLayout(registry)
  const { default: App } = await import('./App.jsx')
  createRoot(document.getElementById('root')).render(<App />)
})
