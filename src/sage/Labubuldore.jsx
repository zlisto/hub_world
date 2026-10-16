import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { useTalker } from './avatar.js'
import { catalog, onCatalog } from './catalog.js'

// Labubuldore, the wise sage of Metaverse Square: a Labubu in a midnight-blue wizard's robe with
// gold trim, a long white beard and bushy brows, a gold medallion, and a gnarled staff topped with
// a glowing orb. Beside him, a stone pedestal projects a floating screen listing every world.
// Talk to him (crosshair + click or E) to browse the worlds and step through to any of them.

export const SAGE = { slug: 'labubuldore', name: 'Labubuldore' }

const H = 1.95 // scale: Labubu is ~1.15 units tall with ears, so he stands about 2.2 m to the ear tips
const ROBE = '#1f2f5c'
const GOLD = '#c9a44a'
const BEARD = '#f2efe8'

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o })
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24)
const TOR = new THREE.TorusGeometry(1, 0.08, 8, 32)
const SKIRT = new THREE.CylinderGeometry(0.19, 0.31, 1, 32, 1, true) // flares out to the hem

// beard tufts [x, y, z, sx, sy, sz] in Labubu units (face front is z ≈ 0.23, chin y ≈ 0.5)
const BEARD_TUFTS = [
  [0, 0.49, 0.2, 0.12, 0.06, 0.07],
  [-0.08, 0.47, 0.19, 0.06, 0.06, 0.05],
  [0.08, 0.47, 0.19, 0.06, 0.06, 0.05],
  [0, 0.42, 0.21, 0.1, 0.07, 0.06],
  [-0.05, 0.37, 0.215, 0.06, 0.07, 0.045],
  [0.05, 0.37, 0.215, 0.06, 0.07, 0.045],
  [0, 0.31, 0.22, 0.065, 0.08, 0.045],
  [0, 0.24, 0.215, 0.04, 0.07, 0.035],
  [0.01, 0.18, 0.205, 0.022, 0.05, 0.025],
]

function Robe() {
  const m = useMemo(
    () => ({
      robe: std(ROBE, { roughness: 0.7, side: THREE.DoubleSide }),
      gold: std(GOLD, { metalness: 0.8, roughness: 0.3 }),
      beard: std(BEARD, { roughness: 1 }),
      beardShade: std('#d9d4ca', { roughness: 1 }),
      wood: std('#5a3a22', { roughness: 0.9 }),
      orb: new THREE.MeshStandardMaterial({ color: '#bfefff', emissive: '#5fd3ff', emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }),
      ring: new THREE.MeshBasicMaterial({ color: '#8fe3ff', transparent: true, opacity: 0.5, toneMapped: false }),
    }),
    [],
  )
  const orb = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    orb.current.rotation.y = t * 0.8
    orb.current.position.y = 1.13 + Math.sin(t * 1.8) * 0.01
  })
  return (
    <>
      {/* robe skirt flaring to the ground, gold hem and a gold band down the front */}
      <mesh geometry={SKIRT} material={m.robe} position={[0, 0.2, 0]} scale={[1, 0.4, 0.92]} />
      <mesh geometry={TOR} material={m.gold} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.31, 0.285, 0.3]} />
      <mesh geometry={CYL} material={m.gold} position={[0, 0.3, 0.205]} scale={[0.035, 0.55, 0.012]} />
      {/* gold medallion on the chest */}
      <mesh geometry={CYL} material={m.gold} position={[0, 0.42, 0.2]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[0.05, 0.012, 0.05]} />
      <mesh geometry={CYL} material={std('#3a5a4a', { metalness: 0.5 })} position={[0, 0.422, 0.207]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[0.028, 0.012, 0.028]} />
      {/* long white beard: soft tufts cascading from under the grin, narrowing to a point */}
      {BEARD_TUFTS.map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} geometry={SPH} material={i % 3 ? m.beard : m.beardShade} position={[x, y, z]} scale={[sx, sy, sz]} />
      ))}
      {/* a mustache sweeping out under the teeth, and big bushy brows flaring up and out */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={SPH} material={m.beard} position={[sx * 0.075, 0.53, 0.225]} rotation={[0, 0, sx * -0.35]} scale={[0.075, 0.03, 0.035]} />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh geometry={SPH} material={m.beard} position={[sx * 0.075, 0.79, 0.225]} rotation={[0, 0, sx * 0.35]} scale={[0.06, 0.025, 0.035]} />
          <mesh geometry={SPH} material={m.beard} position={[sx * 0.135, 0.82, 0.19]} rotation={[0, 0, sx * 0.7]} scale={[0.05, 0.018, 0.03]} />
        </group>
      ))}
      {/* the staff, in his right hand (-x), with a glowing orb in a ring */}
      <group position={[-0.24, 0, 0.08]} rotation={[0, 0, -0.06]}>
        <mesh geometry={CYL} material={m.wood} position={[0, 0.52, 0]} scale={[0.018, 1.04, 0.018]} />
        <mesh geometry={SPH} material={m.wood} position={[0, 1.05, 0]} scale={[0.035, 0.05, 0.035]} />
        <group ref={orb} position={[0, 1.13, 0]}>
          <mesh geometry={SPH} material={m.orb} scale={0.055} />
          <mesh geometry={TOR} material={m.ring} rotation={[Math.PI / 2.4, 0, 0]} scale={0.085} />
        </group>
      </group>
    </>
  )
}

export default function Labubuldore({ position = [0, 0, 0], rotation = 0, talking = false, onTalk }) {
  const { root, head, clickProps } = useTalker(SAGE.slug, { position, rotation, talking, headY: 1.1 * H })
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} {...clickProps(onTalk)}>
      <group ref={head} />
      <group scale={H}>
        <Labubu fur="#b9ab98" expression="grin" shirt={ROBE} anim={talking ? 'wave' : 'idle'} height={1} />
        <Robe />
      </group>
      <pointLight position={[-0.4, 1.9, 0.3]} color="#7fdcff" intensity={1.2} distance={4} />
    </group>
  )
}

// the stone pedestal and the floating screen that lists every world in the registry
function screenTex() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 384
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const draw = () => {
    const g = c.getContext('2d')
    g.clearRect(0, 0, 512, 384)
    g.fillStyle = 'rgba(40, 90, 140, 0.55)'
    g.strokeStyle = 'rgba(160, 230, 255, 0.9)'
    g.lineWidth = 4
    g.beginPath()
    g.roundRect(4, 4, 504, 376, 22)
    g.fill()
    g.stroke()
    g.fillStyle = '#e6f8ff'
    g.font = 'bold 34px system-ui, sans-serif'
    g.fillText('Worlds', 28, 52)
    g.font = '20px system-ui, sans-serif'
    g.fillStyle = 'rgba(200, 240, 255, 0.8)'
    g.fillText('talk to Labubuldore to visit one', 160, 52)
    const worlds = Object.values(catalog)
    worlds.slice(0, 6).forEach((w, i) => {
      const y = 92 + i * 47
      g.fillStyle = 'rgba(255, 255, 255, 0.1)'
      g.beginPath()
      g.roundRect(24, y, 464, 40, 10)
      g.fill()
      g.fillStyle = w.status === 'ok' ? '#5fe39b' : w.status === 'offline' ? '#8a8794' : '#ffd166'
      g.beginPath()
      g.arc(46, y + 20, 7, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.font = 'bold 22px system-ui, sans-serif'
      g.fillText(w.name ?? w.id, 64, y + 28, 300)
      g.fillStyle = 'rgba(200, 240, 255, 0.75)'
      g.font = '17px system-ui, sans-serif'
      g.fillText(w.address ? new URL(w.address).host : '', 340, y + 27, 140)
    })
    if (worlds.length > 6) {
      g.fillStyle = 'rgba(200, 240, 255, 0.8)'
      g.font = '18px system-ui, sans-serif'
      g.fillText(`+ ${worlds.length - 6} more`, 28, 372)
    }
    t.needsUpdate = true
  }
  return { tex: t, draw }
}

export function Pedestal({ position = [0, 0, 0], rotation = 0 }) {
  const { tex, draw } = useMemo(screenTex, [])
  const screen = useRef()
  useEffect(() => {
    draw()
    return onCatalog(draw)
  }, [draw])
  useFrame(({ clock }) => {
    screen.current.position.y = 1.55 + Math.sin(clock.elapsedTime * 1.3) * 0.03
  })
  const stone = useMemo(() => std('#8f8a7f', { roughness: 0.95 }), [])
  const trim = useMemo(() => std('#6f6a60', { roughness: 0.95 }), [])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh material={trim} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.95, 0.16, 0.8]} />
      </mesh>
      <mesh material={stone} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.75, 0.7, 0.6]} />
      </mesh>
      <mesh material={trim} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.95, 0.1, 0.8]} />
      </mesh>
      {/* the glowing top the screen rises from */}
      <mesh position={[0, 0.955, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.65]} />
        <meshBasicMaterial color="#9fe8ff" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh ref={screen} position={[0, 1.55, 0]} rotation={[-0.12, 0, 0]}>
        <planeGeometry args={[1.4, 1.05]} />
        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
