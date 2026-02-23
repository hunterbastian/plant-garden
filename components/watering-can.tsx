"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface WateringCanProps {
  onWater: (canCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function WateringCan({ onWater, containerRef }: WateringCanProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [tilt, setTilt] = useState(0)
  const [isPouring, setIsPouring] = useState(false)
  const [showDrops, setShowDrops] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [waterLevel, setWaterLevel] = useState(6)

  const canRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startCanRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>(0)
  const pourTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 })
  const cumulativeTiltRef = useRef(0)

  // Refill water slowly over time
  useEffect(() => {
    const interval = setInterval(() => {
      setWaterLevel((prev) => Math.min(6, prev + 1))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Spring-back when released
  useEffect(() => {
    if (!isDragging && (pos.x !== 0 || pos.y !== 0)) {
      const startX = pos.x
      const startY = pos.y
      const startTime = performance.now()
      const duration = 500

      const animate = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.exp(-5 * t) * Math.cos(t * 6)
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

  const pour = useCallback(
    (screenX: number) => {
      if (waterLevel <= 0) return
      setIsPouring(true)
      setShowDrops(true)
      setWaterLevel((prev) => Math.max(0, prev - 1))
      onWater(screenX)
      setTimeout(() => setShowDrops(false), 800)
      setTimeout(() => setIsPouring(false), 400)
    },
    [onWater, waterLevel],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animFrameRef.current)
      setIsDragging(true)
      setHasInteracted(true)
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startCanRef.current = { ...pos }
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
      cumulativeTiltRef.current = 0
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      let newX = startCanRef.current.x + dx
      let newY = startCanRef.current.y + dy

      // Clamp within container
      if (containerRef.current && canRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const bRect = canRef.current.getBoundingClientRect()
        const bagW = bRect.width
        const bagH = bRect.height
        // Default position is top: 16, right: 16 -> left = cRect.width - 16 - bagW
        const defaultLeft = cRect.width - 16 - bagW
        const defaultTop = 16
        const minX = -(defaultLeft - 4)
        const maxX = cRect.width - defaultLeft - bagW + 4
        const minY = -defaultTop + 4
        const maxY = cRect.height - defaultTop - bagH - 4

        newX = Math.max(minX, Math.min(maxX, newX))
        newY = Math.max(minY, Math.min(maxY, newY))
      }

      setPos({ x: newX, y: newY })

      // Tilt based on horizontal movement -- tilting left pours water
      const moveDx = e.clientX - lastMoveRef.current.x
      const targetTilt = Math.max(-45, Math.min(15, -moveDx * 2))
      setTilt((prev) => prev + (targetTilt - prev) * 0.35)

      // Track cumulative leftward tilt for pouring detection
      if (moveDx < -2) {
        cumulativeTiltRef.current += Math.abs(moveDx)
      } else if (moveDx > 2) {
        cumulativeTiltRef.current = Math.max(0, cumulativeTiltRef.current - Math.abs(moveDx) * 0.5)
      }

      // Pour when tilted enough to the left
      const now = Date.now()
      if (
        cumulativeTiltRef.current > 20 &&
        now - (lastMoveRef.current.time || 0) < 100
      ) {
        if (!pourTimerRef.current) {
          pourTimerRef.current = setTimeout(() => {
            if (canRef.current) {
              const canRect = canRef.current.getBoundingClientRect()
              pour(canRect.left + canRect.width * 0.25)
            }
            cumulativeTiltRef.current = 0
            pourTimerRef.current = null
          }, 100)
        }
      }

      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: now }
    },
    [isDragging, pour, containerRef],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setTilt(0)
    cumulativeTiltRef.current = 0
    if (pourTimerRef.current) {
      clearTimeout(pourTimerRef.current)
      pourTimerRef.current = null
    }
  }, [])

  // Water level dots
  const waterDots = Array.from({ length: 6 }, (_, i) => i < waterLevel)

  return (
    <div
      ref={canRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-20 touch-none select-none"
      style={{
        top: 16,
        right: 16,
        padding: 8,
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${tilt}deg)`,
        transition: isDragging ? "none" : "transform 0.15s ease-out",
        cursor: isDragging ? "grabbing" : "grab",
        transformOrigin: "70% 40%",
      }}
      role="button"
      aria-label="Grab and tilt the watering can to water plants"
      tabIndex={0}
    >
      {/* Ink-wash watering can */}
      <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
        {/* Body */}
        <path
          d="M18 16 L16 44 Q16 48 20 48 L42 48 Q46 48 46 44 L44 16 Z"
          fill="#e8e2d8"
          stroke="#3d3832"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Water level inside */}
        <path
          d={`M17 ${48 - waterLevel * 4} L17 44 Q17 47 21 47 L41 47 Q45 47 45 44 L45 ${48 - waterLevel * 4} Z`}
          fill="#b8c8d0"
          opacity="0.3"
        />
        {/* Rim */}
        <path
          d="M16 16 Q16 14 18 14 L44 14 Q46 14 46 16"
          fill="none"
          stroke="#3d3832"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Handle */}
        <path
          d="M44 18 Q52 16 50 26 Q48 34 44 34"
          fill="none"
          stroke="#3d3832"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Spout */}
        <path
          d="M18 18 L6 8 Q4 6 4 8 L4 12 Q4 14 6 14 L16 20"
          fill="none"
          stroke="#3d3832"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Spout opening */}
        <circle cx="5" cy="9" r="2" fill="none" stroke="#3d3832" strokeWidth="0.6" opacity="0.5" />
        {/* Little decorative line on body */}
        <line
          x1="24" y1="24" x2="38" y2="24"
          stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.2"
        />
        <line
          x1="24" y1="28" x2="38" y2="28"
          stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.15"
        />
      </svg>

      {/* Water drops when pouring */}
      {showDrops && (
        <div
          className="absolute pointer-events-none"
          style={{ top: 8, left: 0 }}
        >
          <div
            className="animate-water-drop-1 absolute rounded-full"
            style={{ height: 4, width: 3, backgroundColor: "#8aacbc", opacity: 0.7 }}
          />
          <div
            className="animate-water-drop-2 absolute rounded-full"
            style={{ height: 3, width: 2, backgroundColor: "#8aacbc", opacity: 0.6, marginLeft: 6 }}
          />
          <div
            className="animate-water-drop-3 absolute rounded-full"
            style={{ height: 4, width: 3, backgroundColor: "#8aacbc", opacity: 0.5, marginLeft: -4 }}
          />
          <div
            className="animate-water-drop-4 absolute rounded-full"
            style={{ height: 3, width: 2, backgroundColor: "#8aacbc", opacity: 0.6, marginLeft: 2 }}
          />
        </div>
      )}

      {/* Water level indicator dots */}
      <div className="absolute flex gap-0.5" style={{ bottom: 2, left: "50%", transform: "translateX(-50%)" }}>
        {waterDots.map((filled, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: 3,
              height: 3,
              backgroundColor: filled ? "#8aacbc" : "#d6cfc4",
              opacity: filled ? 0.7 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Hint */}
      {!hasInteracted && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans tracking-widest uppercase whitespace-nowrap pointer-events-none animate-soft-fade"
          style={{ bottom: -20, opacity: 0.5, fontSize: 9 }}
        >
          tilt to water
        </p>
      )}
    </div>
  )
}
