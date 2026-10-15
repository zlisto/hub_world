// Sound for the portal (Portal.jsx imports these two). This world has no music, so fadeOut has
// nothing to fade; if you add music, fade it out here (see darul_kebab/src/audio.js).
let ctx = null

export function fadeOut() {}

// the portal whoosh, played when this world is opened on its own (the Metaverse Browser plays its own)
export function whoosh() {
  ctx ??= new AudioContext()
  const t = ctx.currentTime + 0.02
  const noise = ctx.createBuffer(1, ctx.sampleRate * 1.3, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = noise
  const bp = ctx.createBiquadFilter() // a band of noise sweeping up, then away
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(250, t)
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.45)
  bp.frequency.exponentialRampToValueAtTime(400, t + 1.1)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.5, t + 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
  src.connect(bp).connect(g).connect(ctx.destination)
  src.start(t)
}
