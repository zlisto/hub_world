// What the square knows about each registered world, filled in by World.jsx as manifests arrive:
// id -> { id, name, address, owner, description, status: 'loading' | 'ok' | 'offline', arrival }.
// Labubuldore's world list and his floating screen read it.
export const catalog = {}

const listeners = new Set()
export function onCatalog(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function updateCatalog(id, fields) {
  catalog[id] = { ...catalog[id], ...fields }
  listeners.forEach((fn) => fn())
}
