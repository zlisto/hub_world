// The ring of portals around Metaverse Square, worked out from the registry (registry.json, a copy of
// https://github.com/zlisto/metaverse_registry/blob/main/worlds.json).
// Pure data, no browser APIs: vite.config.js uses it to write the square's manifest, and the world
// uses it to place portals and the spawn point in front of each one. Same input, same layout.

export const SELF = 'metaverse_square' // the square's own registry id; it doesn't get a portal to itself
export const NAME = 'Metaverse Square'

export function ring(registry) {
  const worlds = registry.worlds.filter((w) => w.id !== SELF)
  const n = Math.max(worlds.length, 6) // at least 6 slots, so a few worlds don't bunch up
  const R = Math.max(12, n * 0.75) // the ring grows as the registry does, keeping portals ~4.5 m apart
  const slots = worlds.map((w, i) => {
    const a = (i / n) * Math.PI * 2 // 0 = north, going clockwise seen from above
    const x = Math.sin(a) * R
    const z = -Math.cos(a) * R
    return {
      ...w,
      x,
      z,
      rot: Math.atan2(-x, -z), // the portal faces the fountain
      compass: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(a / (Math.PI / 4)) % 8],
      spawnId: `by_${w.id}`,
      // just in front of the portal, facing the fountain
      spawn: { x: x * 0.76, z: z * 0.76, yaw: Math.atan2(x, z) },
    }
  })
  return { slots, R, plazaR: R + 4.5 }
}

// the square's manifest (PROTOCOL.md section 1), generated so it always matches the ring
export function hubManifest(registry, arrival = {}) {
  const { slots } = ring(registry)
  return {
    protocol: 'mvw/0.1',
    name: NAME,
    description:
      'A calm open plaza with a fountain, and a ring of portals to every world in the Metaverse Web registry. Start here to find somewhere to go.',
    spawns: {
      default: 'South of the fountain, facing north into the ring of portals',
      ...Object.fromEntries(slots.map((s) => [s.spawnId, `In front of the portal to ${s.name}, facing the fountain`])),
    },
    portals: slots.map((s) => ({
      id: `to_${s.id}`,
      label: s.name,
      href: s.address,
      spawn: arrival[s.id] ?? 'default',
      where: `The ${s.compass} portal in the ring around the plaza`,
    })),
  }
}
