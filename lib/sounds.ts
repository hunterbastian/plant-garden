"use client"

// Web Audio API sound synthesis for garden sounds
// No external audio files needed -- all procedurally generated

type SoundType = "shake" | "drop" | "water" | "splash" | "plantTap" | "coin" | "refill"

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

// Soft noise burst for rustling/shaking
function playShake() {
  const ctx = getAudioContext()
  const duration = 0.15
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    const envelope = Math.sin(t * Math.PI) * 0.3
    data[i] = (Math.random() * 2 - 1) * envelope
  }
  
  const source = ctx.createBufferSource()
  source.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = 800
  filter.Q.value = 1
  
  const gain = ctx.createGain()
  gain.gain.value = 0.15
  
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

// Soft thud for seed dropping
function playDrop() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = "sine"
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}

// Gentle water trickle
function playWater() {
  const ctx = getAudioContext()
  const duration = 0.4
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    const envelope = Math.sin(t * Math.PI) * 0.25
    const freq = 400 + Math.sin(i * 0.02) * 100
    data[i] = Math.sin(i * freq / ctx.sampleRate * Math.PI * 2) * envelope * 0.3 + (Math.random() * 2 - 1) * envelope * 0.2
  }
  
  const source = ctx.createBufferSource()
  source.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = 2000
  
  const gain = ctx.createGain()
  gain.gain.value = 0.12
  
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

// Pond splash -- bubbly pop
function playSplash() {
  const ctx = getAudioContext()
  
  // Multiple bubbles
  for (let b = 0; b < 4; b++) {
    const delay = b * 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    const baseFreq = 300 + Math.random() * 200
    osc.type = "sine"
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + delay)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + delay + 0.15)
    
    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + 0.2)
  }
}

// Soft pluck for tapping a plant
function playPlantTap() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = "triangle"
  osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.25)
}

// Little chime for earning a coin
function playCoin() {
  const ctx = getAudioContext()
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc1.type = "sine"
  osc1.frequency.value = 880
  osc2.type = "sine"
  osc2.frequency.value = 1320
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start()
  osc2.start()
  osc1.stop(ctx.currentTime + 0.3)
  osc2.stop(ctx.currentTime + 0.3)
}

// Gentle fill sound
function playRefill() {
  const ctx = getAudioContext()
  const duration = 0.5
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    const envelope = Math.sin(t * Math.PI) * 0.2
    const freq = 300 + t * 400
    data[i] = Math.sin(i * freq / ctx.sampleRate * Math.PI * 2) * envelope * 0.4 + (Math.random() * 2 - 1) * envelope * 0.15
  }
  
  const source = ctx.createBufferSource()
  source.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = 1500
  
  const gain = ctx.createGain()
  gain.gain.value = 0.1
  
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

export function playSound(type: SoundType) {
  // Wrap in try-catch and check for user interaction requirement
  try {
    switch (type) {
      case "shake": playShake(); break
      case "drop": playDrop(); break
      case "water": playWater(); break
      case "splash": playSplash(); break
      case "plantTap": playPlantTap(); break
      case "coin": playCoin(); break
      case "refill": playRefill(); break
    }
  } catch {
    // Audio context may not be available or may require user interaction
  }
}
