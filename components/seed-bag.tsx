"use client"

import { useState, useCallback, useRef } from "react"

interface SeedBagProps {
  onShake: (bagCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function SeedBag({ onShake, containerRef }: SeedBagProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [showSeeds, setShowSeeds] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const bagRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startBagRef = useRef({ x: 0, y: 0 })
  const lastXRef = useRef(0)
  const lastDirRef = useRef(0)
  const dirCountRef = useRef(0)
  const velocityRef = useRef<number[]>([])
  const lastShakeRef = useRef(0)

  const dropSeeds = useCallback(
    (screenX: number) => {
      setShowSeeds(true)
      onShake(screenX)
      setTimeout(() => setShowSeeds(false), 800)
    },
    [onShake],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      setHasInteracted(true)
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startBagRef.current = { ...pos }
      lastXRef.current = e.clientX
      lastDirRef.current = 0
      dirCountRef.current = 0
      velocityRef.current = []
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const newX = startBagRef.current.x + dx
      const newY = startBagRef.current.y + dy

      // Clamp within container bounds
      if (containerRef.current && bagRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const bRect = bagRef.current.getBoundingClientRect()
        const bagW = bRect.width
        const bagH = bRect.height

        // Calculate the bag's default center position (50% of container, top 12px)
        const defaultCenterX = cRect.width / 2
        const defaultTop = 12

        // Limit so bag stays within container
        const minX = -(defaultCenterX - bagW / 2)
        const maxX = cRect.width - defaultCenterX - bagW / 2
        const minY = -defaultTop
        const maxY = cRect.height - defaultTop - bagH

        setPos({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        })
      } else {
        setPos({ x: newX, y: newY })
      }

      // Tilt based on horizontal movement
      const moveDx = e.clientX - lastXRef.current
      const tilt = Math.max(-25, Math.min(25, moveDx * 2))
      setRotation(tilt)

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

        // Pass the bag's screen-space center X so garden-box can convert to %
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
        transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px) rotate(${rotation}deg)`,
        transition: isDragging
          ? "none"
          : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: isDragging ? "grabbing" : "grab",
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
      </svg>

      {/* Falling seeds */}
      {showSeeds && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -4 }}
        >
          <div
            className="animate-seed-drop-1 absolute rounded-full"
            style={{ height: 5, width: 5, backgroundColor: "#3d3832" }}
          />
          <div
            className="animate-seed-drop-2 absolute rounded-full"
            style={{
              height: 4,
              width: 4,
              backgroundColor: "#5a5347",
              marginLeft: 8,
            }}
          />
          <div
            className="animate-seed-drop-3 absolute rounded-full"
            style={{
              height: 5,
              width: 5,
              backgroundColor: "#3d3832",
              marginLeft: -8,
            }}
          />
        </div>
      )}

      {/* Hint */}
      {!hasInteracted && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans tracking-widest uppercase whitespace-nowrap pointer-events-none"
          style={{ bottom: -24, opacity: 0.5 }}
        >
          grab & shake
        </p>
      )}
    </div>
  )
}
