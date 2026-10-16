import bundled from '../registry.json'

// The list of worlds, read live from the registry on GitHub every time the square opens, so a
// world merged into the registry gets its portal within minutes, no rebuild needed. If GitHub is
// slow or unreachable, fall back to the copy bundled at the last deploy.
const LIVE = 'https://raw.githubusercontent.com/zlisto/metaverse_registry/main/worlds.json'

// entries that couldn't be placed safely are skipped (the registry's own checks should stop them)
const usable = (w) =>
  w && /^[a-z0-9_]{1,40}$/.test(w.id) && typeof w.name === 'string' && /^https?:\/\/[^\s]+$/.test(w.address)

export async function loadRegistry() {
  try {
    // GitHub caches raw files for up to 5 minutes per address; a value that changes each minute in the
    // query string gets a fresh copy, so new worlds appear within about a minute of being merged
    const res = await fetch(`${LIVE}?minute=${Math.floor(Date.now() / 60000)}`, { cache: 'no-cache', signal: AbortSignal.timeout(2500) })
    const live = await res.json()
    const worlds = (live.worlds ?? []).filter(usable).map((w) => ({ ...w, name: w.name.slice(0, 40) }))
    if (worlds.length) return { ...live, worlds }
  } catch {
    // offline, slow, or not valid JSON: use the bundled copy
  }
  return bundled
}
