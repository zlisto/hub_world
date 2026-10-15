# Metaverse Square

**Walk it:** https://zlisto.github.io/hub_world/

The hub of the Metaverse Web: a calm plaza with a fountain and a ring of portals, one to every world in [`https://github.com/zlisto/metaverse_registry/blob/main/worlds.json`](https://github.com/zlisto/metaverse_registry/blob/main/worlds.json). It's the Metaverse Web's version of the early web's "What's New" page. Add a world to the registry and it gets a portal here.

```bash
npm install
npm run dev
```

Open http://localhost:5178/, or type `localhost:5178` into the Metaverse Browser.

## How it works

- `src/ring.js` lays out the ring from the registry: one slot per world, evenly spaced, facing the fountain, with a spawn point (`by_<id>`) in front of each portal so Back lands you next to the portal you took. The ring grows as the registry does.
- On load, `src/World.jsx` fetches every world's manifest. A world that answers gets a portal labeled with the name from its manifest; one that doesn't gets a dim frame marked "offline right now".
- The square's own manifest is generated from the registry by a small plugin in `vite.config.js`: served live in development, and written to `dist/.well-known/metaverse.json` on build. Its portals always match the ring.
- `mvw.js`, `Portal.jsx`, `Player.jsx` and `TouchControls.jsx` are the same as in `https://github.com/zlisto/world_starter`.

Every time the square opens it reads the [registry](https://github.com/zlisto/metaverse_registry) live from GitHub (`src/registry.js`), so a world merged there gets its portal within minutes, with no rebuild. `registry.json` is the fallback copy, refreshed by the deploy (which also runs daily) and used if GitHub can't be reached.

Each portal lands you at the destination world's `from_square` spawn when its manifest has one (in front of its own portal back here), otherwise at `default`.
