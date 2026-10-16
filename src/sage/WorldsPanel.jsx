import { useEffect, useState } from 'react'
import { catalog, onCatalog } from './catalog.js'
import { navigate } from '../mvw.js'
import { fadeOut, whoosh } from '../audio.js'

// Labubuldore's chat: a greeting, then every world in the registry with a search box.
// Click Go and you step straight through, as if you'd walked into that world's portal.

const GREETING = (visitor) =>
  `Ah, ${visitor || 'traveler'}! I am Labubuldore, keeper of the portals of Metaverse Square. Every world in the registry has a doorway in the ring around this plaza. Tell me where you wish to go, and I'll send you there myself.`

export default function WorldsPanel({ visitor, back, onClose }) {
  const [, bump] = useState(0)
  const [q, setQ] = useState('')
  useEffect(() => onCatalog(() => bump((n) => n + 1)), [])
  useEffect(() => {
    const esc = (e) => e.code === 'Escape' && onClose()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [onClose])

  const order = { ok: 0, loading: 1, offline: 2 }
  const needle = q.trim().toLowerCase()
  const worlds = Object.values(catalog)
    .filter((w) => !needle || `${w.name} ${w.description ?? ''} ${w.address}`.toLowerCase().includes(needle))
    .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))

  const go = (w) => {
    fadeOut()
    whoosh()
    navigate(w.address, w.arrival ?? 'default', back)
  }

  return (
    <div className="guide" role="dialog" aria-label="Talking with Labubuldore">
      <header>
        <div className="guide-avatar sage">🧙</div>
        <div className="guide-title">
          Labubuldore
          <span>keeper of the portals</span>
        </div>
        <button className="guide-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="guide-log">
        <div className="guide-msg tauhid">
          <p>{GREETING(visitor)}</p>
        </div>
        <input className="world-search" placeholder="Search worlds…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search worlds" />
        <div className="world-list">
          {worlds.map((w) => (
            <div key={w.id} className={`world-card ${w.status}`}>
              <div className="world-head">
                <span className="world-dot" title={w.status} />
                <b>{w.name}</b>
                <button onClick={() => go(w)} disabled={w.status !== 'ok'}>
                  {w.status === 'ok' ? 'Go →' : w.status === 'loading' ? '…' : 'offline'}
                </button>
              </div>
              {w.description && <p>{w.description}</p>}
              <span className="world-host">
                {new URL(w.address).host}
                {w.owner ? ` · by ${w.owner}` : ''}
              </span>
            </div>
          ))}
          {!worlds.length && <p className="world-none">No world by that name, I'm afraid.</p>}
        </div>
        <p className="world-add">
          Built a world of your own?{' '}
          <a href="https://github.com/zlisto/metaverse_registry#add-your-world" target="_blank" rel="noreferrer">
            Add it to the registry
          </a>{' '}
          and a portal will appear here.
        </p>
      </div>
      <div className="guide-foot">Click outside, Esc or × to keep exploring</div>
    </div>
  )
}
