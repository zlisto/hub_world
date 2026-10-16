import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Portal from './Portal.jsx'
import { FOUNTAIN_R, PEDESTAL_SPOT, PLAZA_R, RING_R, SAGE_SPOT, SLOTS, names, arrival } from './layout.js'
import Labubuldore, { Pedestal } from './sage/Labubuldore.jsx'
import { updateCatalog } from './sage/catalog.js'
import { NAME } from './ring.js'

const CYL = new THREE.CylinderGeometry(1, 1, 1, 40)

// shorten long text at a word boundary
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n))}…`)
const SPH = new THREE.SphereGeometry(1, 20, 14)

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// pale stone pavers laid in rings around the fountain
function paverTex() {
  return canvasTex(1024, 1024, (g, w) => {
    const c = w / 2
    g.fillStyle = '#b9b2a6'
    g.fillRect(0, 0, w, w)
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let r = 40; r < c; r += 34) {
      const n = Math.round((2 * Math.PI * r) / 42)
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * Math.PI * 2 + (r % 68 ? 0 : Math.PI / n)
        const a1 = a0 + (Math.PI * 2) / n - 0.012
        const v = 196 + Math.floor(rnd() * 34)
        g.fillStyle = `rgb(${v},${v - 6},${v - 14})`
        g.beginPath()
        g.arc(c, c, r + 31, a0, a1)
        g.arc(c, c, r, a1, a0, true)
        g.fill()
      }
    }
  })
}

// a sign that reads from both sides
function Sign({ text, sub, y = 3.6, w = 3.4, color = '#ff4fa3' }) {
  const tex = useMemo(
    () =>
      canvasTex(1024, 256, (g) => {
        g.fillStyle = 'rgba(11,11,13,0.88)'
        g.beginPath()
        g.roundRect(6, 6, 1012, 244, 48)
        g.fill()
        g.strokeStyle = color
        g.lineWidth = 8
        g.stroke()
        g.textAlign = 'center'
        g.fillStyle = '#fff'
        g.font = 'bold 104px Georgia, serif'
        g.fillText(text, 512, 132)
        g.fillStyle = color
        g.font = '48px system-ui, sans-serif'
        g.fillText(sub, 512, 210)
      }),
    [text, sub, color],
  )
  return [0, Math.PI].map((r) => (
    <mesh key={r} position={[0, y, 0]} rotation={[0, r, 0]}>
      <planeGeometry args={[w, w / 4]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  ))
}

function Fountain() {
  const water = useRef()
  const jets = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    water.current.material.color.setHSL(0.55, 0.55, 0.55 + Math.sin(t * 2) * 0.03)
    jets.current.children.forEach((j, i) => (j.scale.y = 0.55 + Math.sin(t * 3 + i) * 0.08))
  })
  return (
    <group>
      <mesh geometry={CYL} position={[0, 0.3, 0]} scale={[FOUNTAIN_R, 0.6, FOUNTAIN_R]}>
        <meshStandardMaterial color="#d8d2c6" roughness={0.7} />
      </mesh>
      <mesh ref={water} geometry={CYL} position={[0, 0.58, 0]} scale={[FOUNTAIN_R - 0.18, 0.04, FOUNTAIN_R - 0.18]}>
        <meshStandardMaterial color="#5fb3d6" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh geometry={CYL} position={[0, 1.1, 0]} scale={[0.22, 1.2, 0.22]}>
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      <mesh geometry={CYL} position={[0, 1.7, 0]} scale={[0.8, 0.12, 0.8]}>
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      <group ref={jets}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} geometry={SPH} position={[Math.sin(a) * 0.55, 1.95, Math.cos(a) * 0.55]} scale={[0.07, 0.55, 0.07]}>
              <meshStandardMaterial color="#cdeefa" transparent opacity={0.7} />
            </mesh>
          )
        })}
      </group>
      <Sign text={NAME} sub="portals to every world in the registry" y={3.4} w={3.6} />
    </group>
  )
}

// a world whose manifest didn't load: a dim empty frame with its name, no portal
function Offline({ s, state }) {
  return (
    <group position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 1.05, 1.3, 0]}>
          <boxGeometry args={[0.09, 2.6, 0.09]} />
          <meshStandardMaterial color="#55525c" />
        </mesh>
      ))}
      <mesh position={[0, 2.65, 0]}>
        <boxGeometry args={[2.2, 0.09, 0.09]} />
        <meshStandardMaterial color="#55525c" />
      </mesh>
      <Sign text={s.name} sub={state === 'loading' ? 'looking for this world…' : 'offline right now'} y={3.05} w={1.6} color="#8a8794" />
    </group>
  )
}

// lamps between the portals, benches facing the fountain, trees beyond the plaza
function Furniture() {
  const n = Math.max(SLOTS.length, 3)
  const lamps = Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.5) / n) * Math.PI * 2
    return [Math.sin(a) * RING_R, -Math.cos(a) * RING_R, a]
  })
  const trees = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + 0.1
    const r = PLAZA_R + 3 + (i % 3) * 2.2
    return [Math.sin(a) * r, -Math.cos(a) * r, 0.8 + (i % 4) * 0.2]
  })
  return (
    <>
      {lamps.map(([x, z, a], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={CYL} position={[0, 1.6, 0]} scale={[0.06, 3.2, 0.06]}>
            <meshStandardMaterial color="#2b2a30" />
          </mesh>
          <mesh geometry={SPH} position={[0, 3.3, 0]} scale={0.2}>
            <meshBasicMaterial color="#ffe8b8" toneMapped={false} />
          </mesh>
          {/* a bench just inside each lamp, facing the fountain */}
          <group position={[-Math.sin(a) * 1.6, 0, Math.cos(a) * 1.6]} rotation={[0, Math.atan2(-x, -z), 0]}>
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[1.6, 0.08, 0.45]} />
              <meshStandardMaterial color="#8a5a3a" />
            </mesh>
            {[-0.65, 0.65].map((bx) => (
              <mesh key={bx} position={[bx, 0.22, 0]}>
                <boxGeometry args={[0.08, 0.44, 0.4]} />
                <meshStandardMaterial color="#2b2a30" />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {trees.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh geometry={CYL} position={[0, 1.2, 0]} scale={[0.15, 2.4, 0.15]}>
            <meshStandardMaterial color="#5a3d2b" />
          </mesh>
          <mesh geometry={SPH} position={[0, 3.2, 0]} scale={[1.5, 1.8, 1.5]}>
            <meshStandardMaterial color={i % 2 ? '#4f7d46' : '#5f8f4e'} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export default function World({ talking = false, onTalk }) {
  // fetch every world's manifest: a portal if it loads, a dim "offline" frame if not
  const [state, setState] = useState(() => Object.fromEntries(SLOTS.map((s) => [s.id, 'loading'])))
  const [, bump] = useState(0)
  useEffect(() => {
    let live = true
    for (const s of SLOTS) {
      updateCatalog(s.id, { id: s.id, name: s.name, address: s.address, owner: s.owner, status: 'loading' })
      fetch(new URL('.well-known/metaverse.json', s.address), { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((m) => {
          if (!live || m?.protocol !== 'mvw/0.1') throw new Error('not an mvw/0.1 manifest')
          if (typeof m.name === 'string' && m.name) names[s.id] = m.name.slice(0, 40)
          // land in front of the world's own portal back here when it has one (PROTOCOL.md section 7)
          arrival[s.id] = m.spawns && 'from_square' in m.spawns ? 'from_square' : 'default'
          setState((v) => ({ ...v, [s.id]: 'ok' }))
          updateCatalog(s.id, {
            name: names[s.id],
            description: typeof m.description === 'string' ? clip(m.description, 200) : '',
            arrival: arrival[s.id],
            status: 'ok',
          })
          bump((n) => n + 1)
        })
        .catch(() => {
          if (!live) return
          setState((v) => ({ ...v, [s.id]: 'offline' }))
          updateCatalog(s.id, { status: 'offline' })
        })
    }
    return () => {
      live = false
    }
  }, [])
  const paver = useMemo(paverTex, [])

  return (
    <>
      <color attach="background" args={['#c7d8ea']} />
      <fog attach="fog" args={['#c7d8ea', 30, 70]} />
      <hemisphereLight args={['#fff4e2', '#6b7d5a', 1.1]} />
      <directionalLight position={[12, 20, 8]} intensity={1.4} color="#fff1dc" />

      {/* grass, then the paved plaza, then a low stone curb around it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[80, 48]} />
        <meshStandardMaterial color="#7da35f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PLAZA_R, 96]} />
        <meshStandardMaterial map={paver} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PLAZA_R, 0.2, 8, 96]} />
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>

      <Fountain />
      <Furniture />

      {/* Labubuldore, keeper of the portals, and his pedestal with the floating list of worlds */}
      <Labubuldore position={[SAGE_SPOT.x, 0, SAGE_SPOT.z]} rotation={SAGE_SPOT.rot} talking={talking} onTalk={onTalk} />
      <Pedestal position={[PEDESTAL_SPOT.x, 0, PEDESTAL_SPOT.z]} rotation={SAGE_SPOT.rot} />

      {SLOTS.map((s) =>
        state[s.id] === 'ok' ? (
          <Portal key={s.id} x={s.x} z={s.z} rot={s.rot} href={s.address} spawn={arrival[s.id]} back={s.spawnId} label={names[s.id]} sub={new URL(s.address).host} />
        ) : (
          <Offline key={s.id} s={s} state={state[s.id]} />
        ),
      )}
    </>
  )
}
