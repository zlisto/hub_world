import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import TouchControls from './TouchControls.jsx'
import { EYE, SPAWN } from './layout.js'
import { NAME } from './ring.js'
import { onIdentity, presence, spawnId } from './mvw.js'

const BLURB = 'A plaza with a portal to every world in the Metaverse Web registry. Pick one and walk through.'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const lockRef = useRef()
  const onLock = useCallback((v) => {
    setLocked(v)
    if (v) setFree(false) // the mouse is locked now; Esc brings back the menu as a pause screen
  }, [])
  // Arriving through a portal (the address has ?spawn=), skip the start menu and drop straight in:
  // the keys work right away, and the first click locks the mouse for looking around.
  const [free, setFree] = useState(() => spawnId !== null)
  const freeRef = useRef(free)
  freeRef.current = free
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
  useEffect(() => {
    document.body.classList.toggle('freelook', free)
  }, [free])
  const playing = locked || touchOn || free
  useEffect(() => {
    if (!free) return
    if (isTouch) {
      setTouch(true) // phones: the joystick needs no click, so just turn it on
      setFree(false)
      return
    }
    const click = (e) => !e.target.closest('button') && lockRef.current?.()
    addEventListener('mousedown', click)
    return () => removeEventListener('mousedown', click)
  }, [free]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Canvas camera={{ fov: 72, near: 0.05, far: 200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
        <World />
        <Player lockRef={lockRef} freeRef={freeRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" style={me?.color ? { background: me.color } : undefined} />
        {where}
      </div>
      {playing && <div className="crosshair" />}
      {free && <div className="hint">Move the mouse to look · click to lock it · WASD to walk</div>}
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
