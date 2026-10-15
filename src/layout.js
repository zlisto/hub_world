import { pickSpawn } from './mvw.js'
import { ring, NAME } from './ring.js'

// Metaverse Square: a round plaza with a fountain in the middle and a ring of portals, one per
// world in the registry. Units are meters; +x = east, -z = north.

export const H = 6 // no ceiling, but the player code wants a height
export const SPEED = { walk: 6, run: 10 } // meters per second; Shift runs
export const EYE = 1.65
export const R_PLAYER = 0.35
export const FOUNTAIN_R = 1.9
// The ring depends on the registry, which main.jsx loads (live from GitHub, or the bundled copy)
// before the world starts, so these are filled in by initLayout() first thing.
export let SLOTS, RING_R, PLAZA_R, SPAWNS, SPAWN
// world names as their manifests report them (filled in by World.jsx once fetched)
export const names = {}
// which spawn to arrive at in each world: its `from_square` if it has one, else `default`
export const arrival = {}

export function initLayout(registry) {
  ;({ slots: SLOTS, R: RING_R, plazaR: PLAZA_R } = ring(registry))
  // arrival points: south of the fountain, plus one in front of each portal so Back lands you there
  SPAWNS = {
    default: { x: 0, z: 5.5, yaw: 0 },
    ...Object.fromEntries(SLOTS.map((s) => [s.spawnId, s.spawn])),
  }
  SPAWN = pickSpawn(SPAWNS)
  for (const s of SLOTS) names[s.id] = s.name
}

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
