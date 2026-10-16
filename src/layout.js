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
    // in front of Labubuldore, facing him: Back from a world he sent you to lands you here
    by_labubuldore: { x: SAGE_SPOT.x - 0.9, z: SAGE_SPOT.z + 3.2, yaw: Math.atan2(-0.9, 3.2) },
    ...Object.fromEntries(SLOTS.map((s) => [s.spawnId, s.spawn])),
  }
  SPAWN = pickSpawn(SPAWNS)
  for (const s of SLOTS) names[s.id] = s.name
}

// Labubuldore stands southeast of the fountain beside his pedestal, turned toward the default spawn
export const SAGE_SPOT = { x: 2.6, z: 3.2, r: 0.45 }
SAGE_SPOT.rot = Math.atan2(0 - SAGE_SPOT.x, 5.5 - SAGE_SPOT.z)
export const PEDESTAL_SPOT = { x: 1.35, z: 3.0, r: 0.6 }

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
  // and out of Labubuldore and his pedestal
  for (const o of [SAGE_SPOT, PEDESTAL_SPOT]) {
    const dx = pos.x - o.x
    const dz = pos.z - o.z
    const d = Math.hypot(dx, dz)
    const rr = R_PLAYER + o.r
    if (d < rr && d > 1e-6) {
      pos.x = o.x + (dx / d) * rr
      pos.z = o.z + (dz / d) * rr
    }
  }
  return pos
}

export function locate(x, z) {
  if (Math.hypot(x - SAGE_SPOT.x, z - SAGE_SPOT.z) < 2.4) return `${NAME} · with Labubuldore`
  let best = null
  for (const s of SLOTS) {
    const d = Math.hypot(x - s.x, z - s.z)
    if (d < 2.6 && (!best || d < best.d)) best = { d, s }
  }
  if (best) return `${NAME} · by the portal to ${names[best.s.id]}`
  if (Math.hypot(x, z) < FOUNTAIN_R + 1.4) return `${NAME} · at the fountain`
  return `${NAME} · in the plaza`
}
