"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface SeedBagProps {
  onShake: (bagCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function SeedBag({ onShake, containerRef }: SeedBagProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [squish, setSquish] = useState({ x: 1, y: 1 })
  const [showSeeds, setShowSeeds] = useState(false)
  const [justDropped, setJustDropped] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [innerSeedOffset, setInnerSeedOffset] = useState(0)

  const bagRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startBagRef = useRef({ x: 0, y: 0 })
  const lastXRef = useRef(0)
  const lastDirRef = useRef(0)
  const dirCountRef = useRef(0)
  const velocityRef = useRef<number[]>([])
  const lastShakeRef = useRef(0)
  const animFrameRef = useRef<number>(0)

  // Smooth spring-back when not dragging
  useEffect(() => {
    if (!isDragging && (pos.x !== 0 || pos.y !== 0)) {
      // Animate spring-back
      const startX = pos.x
      const startY = pos.y
      const startTime = performance.now()
      const duration = 600

      const spring = (t: number) => {
        // Damped spring curve
        const decay = Math.exp(-4 * t)
        const oscillation = Math.cos(t * 8)
        return decay * oscillation
      }

      const animate = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - spring(1 - t)
        const curvedT = Math.min(eased, 1)

        setPos({
          x: startX * (1 - curvedT),
          y: startY * (1 - curvedT),
        })

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          setPos({ x: 0, y: 0 })
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animFrameRef.current)
    }
  }, [isDragging])

  const dropSeeds = useCallback(
    (screenX: number) => {
      setShowSeeds(true)
      setJustDropped(true)

      // Bounce squish on drop
      setSquish({ x: 1.15, y: 0.85 })
      setTimeout(() => setSquish({ x: 0.92, y: 1.1 }), 120)
      setTimeout(() => setSquish({ x: 1.04, y: 0.96 }), 240)
      setTimeout(() => setSquish({ x: 1, y: 1 }), 360)

      onShake(screenX)
      setTimeout(() => setShowSeeds(false), 900)
      setTimeout(() => setJustDropped(false), 500)
    },
    [onShake],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      cancelAnimationFrame(animFrameRef.current)
      setIsDragging(true)
      setHasInteracted(true)
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startBagRef.current = { ...pos }
      lastXRef.current = e.clientX
      lastDirRef.current = 0
      dirCountRef.current = 0
      velocityRef.current = []

      // Pickup squish
      setSquish({ x: 1.08, y: 0.93 })
      setTimeout(() => setSquish({ x: 1, y: 1 }), 150)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      let newX = startBagRef.current.x + dx
      let newY = startBagRef.current.y + dy

      // Clamp within container
      if (containerRef.current && bagRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const bRect = bagRef.current.getBoundingClientRect()
        const bagW = bRect.width
        const bagH = bRect.height
        const defaultCenterX = cRect.width / 2
        const defaultTop = 12
        const minX = -(defaultCenterX - bagW / 2 - 4)
        const maxX = cRect.width - defaultCenterX - bagW / 2 + 4
        const minY = -defaultTop + 4
        const maxY = cRect.height - defaultTop - bagH - 4

        newX = Math.max(minX, Math.min(maxX, newX))
        newY = Math.max(minY, Math.min(maxY, newY))
      }

      setPos({ x: newX, y: newY })

      // Calculate tilt with springy overshoot feel
      const moveDx = e.clientX - lastXRef.current
      const targetTilt = Math.max(-30, Math.min(30, moveDx * 2.5))
      setRotation((prev) => prev + (targetTilt - prev) * 0.4)

      // Move inner seeds to simulate weight shifting
      setInnerSeedOffset(Math.max(-4, Math.min(4, moveDx * 0.8)))

      // Squish on fast direction changes
      const speed = Math.abs(moveDx)
      if (speed > 6) {
        setSquish({ x: 0.94, y: 1.06 })
        setTimeout(() => setSquish({ x: 1, y: 1 }), 100)
      }

      // Direction change tracking
      const dir = moveDx > 1 ? 1 : moveDx < -1 ? -1 : 0
      if (dir !== 0 && dir !== lastDirRef.current) {
        lastDirRef.current = dir
        dirCountRef.current++
      }

      // Velocity tracking
      velocityRef.current.push(Math.abs(moveDx))
      if (velocityRef.current.length > 8) velocityRef.current.shift()

      const avgVel =
        velocityRef.current.reduce((a, b) => a + b, 0) /
        (velocityRef.current.length || 1)
      const now = Date.now()

      if (
        dirCountRef.current >= 3 &&
        avgVel > 3 &&
        now - lastShakeRef.current > 600
      ) {
        lastShakeRef.current = now
        dirCountRef.current = 0

        if (bagRef.current) {
          const bagRect = bagRef.current.getBoundingClientRect()
          dropSeeds(bagRect.left + bagRect.width / 2)
        }
      }

      lastXRef.current = e.clientX
    },
    [isDragging, dropSeeds, containerRef],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setRotation(0)
    setSquish({ x: 1, y: 1 })
    setInnerSeedOffset(0)
    velocityRef.current = []
    dirCountRef.current = 0
  }, [])

  return (
    <div
      ref={bagRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-20 touch-none select-none"
      style={{
        top: 12,
        left: "50%",
        transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px) rotate(${rotation}deg) scaleX(${squish.x}) scaleY(${squish.y})`,
        transition: isDragging ? "none" : "transform 0.08s ease-out",
        cursor: isDragging ? "grabbing" : "grab",
        filter: justDropped ? "brightness(1.05)" : "none",
      }}
      role="button"
      aria-label="Grab and shake the seed bag to plant seeds"
      tabIndex={0}
    >
      {/* Ink-wash bag */}
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
        {/* Kanji-like mark */}
        <line
          x1="32" y1="38" x2="32" y2="56"
          stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"
        />
        <line
          x1="26" y1="44" x2="38" y2="44"
          stroke="#3d3832" strokeWidth="1" strokeLinecap="round" opacity="0.4"
        />
        <line
          x1="27" y1="50" x2="37" y2="50"
          stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"
        />

        {/* Inner seeds that shift with movement */}
        <circle
          cx={28 + innerSeedOffset}
          cy="64"
          r="2.5"
          fill="#3d3832"
          opacity="0.15"
        />
        <circle
          cx={34 + innerSeedOffset * 0.7}
          cy="66"
          r="2"
          fill="#3d3832"
          opacity="0.12"
        />
        <circle
          cx={24 + innerSeedOffset * 1.2}
          cy="68"
          r="1.8"
          fill="#3d3832"
          opacity="0.1"
        />
        <circle
          cx={38 + innerSeedOffset * 0.5}
          cy="63"
          r="2.2"
          fill="#3d3832"
          opacity="0.13"
        />
      </svg>

      {/* Falling seeds with staggered timing */}
      {showSeeds && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ bottom: -2 }}
        >
          <div
            className="animate-seed-drop-1 absolute rounded-full"
            style={{ height: 5, width: 5, backgroundColor: "#3d3832" }}
          />
          <div
            className="animate-seed-drop-2 absolute rounded-full"
            style={{ height: 4, width: 4, backgroundColor: "#5a5347", marginLeft: 10 }}
          />
          <div
            className="animate-seed-drop-3 absolute rounded-full"
            style={{ height: 5, width: 5, backgroundColor: "#3d3832", marginLeft: -10 }}
          />
          <div
            className="animate-seed-drop-4 absolute rounded-full"
            style={{ height: 3, width: 3, backgroundColor: "#5a5347", marginLeft: 4 }}
          />
          <div
            className="animate-seed-drop-5 absolute rounded-full"
            style={{ height: 3, width: 3, backgroundColor: "#3d3832", marginLeft: -5 }}
          />
        </div>
      )}

      {/* Hint */}
      {!hasInteracted && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans tracking-widest uppercase whitespace-nowrap pointer-events-none animate-soft-fade"
          style={{ bottom: -24, opacity: 0.5 }}
        >
          grab & shake
        </p>
      )}
    </div>
  )
}
