"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface SeedBagProps {
  onShake: () => void
}

export function SeedBag({ onShake }: SeedBagProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [showSeeds, setShowSeeds] = useState(false)

  const bagRef = useRef<HTMLDivElement>(null)
  const lastXRef = useRef(0)
  const velocityHistoryRef = useRef<number[]>([])
  const shakeCountRef = useRef(0)
  const lastShakeTimeRef = useRef(0)
  const directionRef = useRef(0) // tracks direction changes
  const lastDirRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const startPosRef = useRef({ x: 0, y: 0 })

  const dropSeeds = useCallback(() => {
    setShowSeeds(true)
    onShake()
    setTimeout(() => setShowSeeds(false), 800)
  }, [onShake])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    lastXRef.current = e.clientX
    startPosRef.current = { x: e.clientX, y: e.clientY }
    velocityHistoryRef.current = []
    shakeCountRef.current = 0
    directionRef.current = 0
    lastDirRef.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return

    const dx = e.clientX - lastXRef.current
    const dy = e.clientY - startPosRef.current.y

    // Track direction changes (sign flips = shaking)
    const currentDir = dx > 0 ? 1 : dx < 0 ? -1 : 0
    if (currentDir !== 0 && currentDir !== lastDirRef.current) {
      lastDirRef.current = currentDir
      directionRef.current++
    }

    // Tilt bag based on horizontal delta
    const tilt = Math.max(-30, Math.min(30, dx * 1.5))
    setRotation(tilt)
    setOffsetX(Math.max(-40, Math.min(40, e.clientX - startPosRef.current.x)))
    setOffsetY(Math.max(-20, Math.min(30, dy * 0.3)))

    // Track velocity
    velocityHistoryRef.current.push(Math.abs(dx))
    if (velocityHistoryRef.current.length > 6) {
      velocityHistoryRef.current.shift()
    }

    // Detect shake: enough direction changes + speed
    const avgVelocity =
      velocityHistoryRef.current.reduce((a, b) => a + b, 0) /
      (velocityHistoryRef.current.length || 1)

    const now = Date.now()
    if (
      directionRef.current >= 3 &&
      avgVelocity > 4 &&
      now - lastShakeTimeRef.current > 600
    ) {
      lastShakeTimeRef.current = now
      directionRef.current = 0
      dropSeeds()
    }

    lastXRef.current = e.clientX
  }, [isDragging, dropSeeds])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    velocityHistoryRef.current = []
    directionRef.current = 0

    // Animate back to center
    setRotation(0)
    setOffsetX(0)
    setOffsetY(0)
  }, [])

  // Spring the bag back smoothly when released
  useEffect(() => {
    if (isDragging) return
    // Rotation and offset reset is handled by CSS transition
  }, [isDragging])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        ref={bagRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative touch-none"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          userSelect: "none",
        }}
        role="button"
        aria-label="Grab and shake the seed bag to plant seeds"
        tabIndex={0}
      >
        {/* Minimal ink-wash style bag */}
        <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
          {/* Bag body */}
          <path
            d="M16 22 Q14 22 12 70 Q12 76 20 76 L44 76 Q52 76 52 70 L50 22 Z"
            fill="#d6cfc4"
            stroke="#3d3832"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Gathered top */}
          <path
            d="M16 22 Q24 18 32 20 Q40 18 48 22"
            fill="none"
            stroke="#3d3832"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Tie string */}
          <path
            d="M26 20 Q28 16 32 18 Q36 16 38 20"
            fill="none"
            stroke="#3d3832"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {/* Simple kanji-like mark */}
          <line x1="32" y1="38" x2="32" y2="56" stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <line x1="26" y1="44" x2="38" y2="44" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <line x1="27" y1="50" x2="37" y2="50" stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        </svg>

        {/* Falling seeds */}
        {showSeeds && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div
              className="animate-seed-drop-1 absolute rounded-full"
              style={{ height: 5, width: 5, backgroundColor: "#3d3832" }}
            />
            <div
              className="animate-seed-drop-2 absolute rounded-full"
              style={{ height: 4, width: 4, backgroundColor: "#5a5347", marginLeft: 6 }}
            />
            <div
              className="animate-seed-drop-3 absolute rounded-full"
              style={{ height: 5, width: 5, backgroundColor: "#3d3832", marginLeft: -6 }}
            />
          </div>
        )}
      </div>

      {/* Hint text */}
      <p
        className="text-xs text-muted-foreground font-sans tracking-widest uppercase"
        style={{
          opacity: isDragging ? 0 : 0.6,
          transition: "opacity 0.3s ease",
        }}
      >
        grab {"&"} shake
      </p>
    </div>
  )
}
