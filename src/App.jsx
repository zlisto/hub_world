import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import TouchControls from './TouchControls.jsx'
import { EYE, SPAWN } from './layout.js'
import { NAME } from './ring.js'
import { onIdentity, presence } from './mvw.js'

const BLURB = 'A plaza with a portal to every world in the Metaverse Web registry. Pick one and walk through.'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const lockRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  // tell the Metaverse Browser where you are whenever the area changes (mvw/0.1 `presence`)
  const onWhere = useCallback((w) => {
    setWhere(w)
    presence(w)
  }, [])
  // who's visiting: the Metaverse Browser sends { name, color }. Opened on its own, it stays null.
  const [me, setMe] = useState(null)
  useEffect(() => onIdentity(setMe), [])

  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn

  return (
    <>
      <Canvas camera={{ fov: 72, near: 0.05, far: 200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
        <World />
        <Player lockRef={lockRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" style={me?.color ? { background: me.color } : undefined} />
        {where}
      </div>
      {playing && <div className="crosshair" />}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {!playing && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            {/* the greeting: uses your name from the Metaverse Browser when there is one */}
            <div className="kicker">{me?.name ? `Welcome, ${me.name}` : 'Welcome'}</div>
            <h1>{NAME}</h1>
            <p className="sub">{BLURB}</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            <div className="keys">
              {isTouch ? (
                <>
                  <span><b>Left thumb</b> walk</span>
                  <span><b>Right thumb</b> drag to look</span>
                </>
              ) : (
                <>
                  <span><b>WASD</b> walk</span>
                  <span><b>Mouse</b> look</span>
                  <span><b>Shift</b> run</span>
                  <span><b>Space</b> jump</span>
                  <span><b>C</b> crouch</span>
                  <span><b>Esc</b> pause</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
