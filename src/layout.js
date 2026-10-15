import { pickSpawn } from './mvw.js'
import { ring, NAME } from './ring.js'
import registry from '../registry.json' // a copy of the registry; the deploy refreshes it daily

// Metaverse Square: a round plaza with a fountain in the middle and a ring of portals, one per
// world in the registry. Units are meters; +x = east, -z = north.

export const H = 6 // no ceiling, but the player code wants a height
export const EYE = 1.65
export const R_PLAYER = 0.35
export const FOUNTAIN_R = 1.9
export const { slots: SLOTS, R: RING_R, plazaR: PLAZA_R } = ring(registry)

// Arrival points: south of the fountain, plus one in front of each portal so Back lands you there
export const SPAWNS = {
  default: { x: 0, z: 5.5, yaw: 0 },
  ...Object.fromEntries(SLOTS.map((s) => [s.spawnId, s.spawn])),
}
export const SPAWN = pickSpawn(SPAWNS)

// world names as their manifests report them (filled in by World.jsx once fetched)
export const names = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]))

// stay on the plaza and out of the fountain
export function collide(pos) {
  const r = Math.hypot(pos.x, pos.z)
  const max = PLAZA_R - 0.6 - R_PLAYER
  const min = FOUNTAIN_R + R_PLAYER
  if (r > max) {
    pos.x *= max / r
    pos.z *= max / r
  } else if (r < min && r > 1e-6) {
    pos.x *= min / r
    pos.z *= min / r
  }
  return pos
}

export function locate(x, z) {
  let best = null
  for (const s of SLOTS) {
    const d = Math.hypot(x - s.x, z - s.z)
    if (d < 2.6 && (!best || d < best.d)) best = { d, s }
  }
  if (best) return `${NAME} · by the portal to ${names[best.s.id]}`
  if (Math.hypot(x, z) < FOUNTAIN_R + 1.4) return `${NAME} · at the fountain`
  return `${NAME} · in the plaza`
}
