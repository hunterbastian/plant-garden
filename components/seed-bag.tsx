"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { playSound } from "@/lib/sounds"

interface SeedBagProps {
  onShake: (bagCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function SeedBag({ onShake, containerRef }: SeedBagProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showSeeds, setShowSeeds] = useState(false)
  const [justDropped, setJustDropped] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const bagRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startBagRef = useRef({ x: 0, y: 0 })
  const posRef = useRef({ x: 0, y: 0 })
  const rotRef = useRef(0)
  const squishRef = useRef({ x: 1, y: 1 })
  const seedOffsetRef = useRef(0)
  const lastXRef = useRef(0)
  const lastDirRef = useRef(0)
  const dirCountRef = useRef(0)
  const velocityRef = useRef<number[]>([])
  const lastShakeRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const rafPendingRef = useRef(false)

  // Apply transforms directly to DOM for performance
  const applyTransform = useCallback(() => {
    if (!bagRef.current) return
    const { x, y } = posRef.current
    const r = rotRef.current
    const sx = squishRef.current.x
    const sy = squishRef.current.y
    bagRef.current.style.transform = `translate(calc(-50% + ${x}px), ${y}px) rotate(${r}deg) scaleX(${sx}) scaleY(${sy})`

    // Update inner seed circles
    const seeds = bagRef.current.querySelectorAll<SVGCircleElement>("[data-inner-seed]")
    seeds.forEach((seed) => {
      const base = parseFloat(seed.dataset.baseCx || "0")
      const factor = parseFloat(seed.dataset.factor || "1")
      seed.setAttribute("cx", String(base + seedOffsetRef.current * factor))
    })
  }, [])

  // Damped spring animation for spring-back
  const springBack = useCallback(() => {
    const startX = posRef.current.x
    const startY = posRef.current.y
    const startR = rotRef.current
    const startTime = performance.now()
    const duration = 500

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      // Critically damped spring
      const s = 1 - (1 + 5 * t) * Math.exp(-5 * t)

      posRef.current = { x: startX * (1 - s), y: startY * (1 - s) }
      rotRef.current = startR * (1 - s)
      squishRef.current = { x: 1, y: 1 }
      seedOffsetRef.current = 0
      applyTransform()

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        posRef.current = { x: 0, y: 0 }
        rotRef.current = 0
        applyTransform()
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [applyTransform])

  // Squish bounce sequence (purely DOM, no state)
  const bounceSquish = useCallback(
    (type: "pickup" | "drop") => {
      const frames =
        type === "pickup"
          ? [
              { x: 1.08, y: 0.93, t: 0 },
              { x: 1, y: 1, t: 150 },
            ]
          : [
              { x: 1.15, y: 0.85, t: 0 },
              { x: 0.92, y: 1.1, t: 100 },
              { x: 1.04, y: 0.96, t: 200 },
              { x: 1, y: 1, t: 320 },
            ]
      frames.forEach(({ x, y, t }) => {
        setTimeout(() => {
          squishRef.current = { x, y }
          applyTransform()
        }, t)
      })
    },
    [applyTransform],
  )

  const dropSeeds = useCallback(
    (screenX: number) => {
      setShowSeeds(true)
      setJustDropped(true)
      bounceSquish("drop")
      playSound("drop")
      onShake(screenX)
      setTimeout(() => setShowSeeds(false), 1200)
      setTimeout(() => setJustDropped(false), 500)
    },
    [onShake, bounceSquish],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animFrameRef.current)
      setIsDragging(true)
      setHasInteracted(true)
      playSound("shake")
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startBagRef.current = { ...posRef.current }
      lastXRef.current = e.clientX
      lastDirRef.current = 0
      dirCountRef.current = 0
      velocityRef.current = []
      bounceSquish("pickup")
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [bounceSquish],
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

      const moveDx = e.clientX - lastXRef.current
      const targetTilt = Math.max(-30, Math.min(30, moveDx * 2.5))

      // Update refs (no re-render)
      posRef.current = { x: newX, y: newY }
      rotRef.current += (targetTilt - rotRef.current) * 0.4
      seedOffsetRef.current = Math.max(-4, Math.min(4, moveDx * 0.8))

      // Fast direction change squish
      if (Math.abs(moveDx) > 6) {
        squishRef.current = { x: 0.94, y: 1.06 }
        setTimeout(() => {
          squishRef.current = { x: 1, y: 1 }
          applyTransform()
        }, 80)
      }

      // Batch DOM write in rAF
      if (!rafPendingRef.current) {
        rafPendingRef.current = true
        requestAnimationFrame(() => {
          applyTransform()
          rafPendingRef.current = false
        })
      }

      // Direction change tracking
      const dir = moveDx > 1 ? 1 : moveDx < -1 ? -1 : 0
      if (dir !== 0 && dir !== lastDirRef.current) {
        lastDirRef.current = dir
        dirCountRef.current++
      }

      velocityRef.current.push(Math.abs(moveDx))
      if (velocityRef.current.length > 8) velocityRef.current.shift()

      const avgVel =
        velocityRef.current.reduce((a, b) => a + b, 0) /
        (velocityRef.current.length || 1)
      const now = Date.now()

      if (dirCountRef.current >= 3 && avgVel > 3 && now - lastShakeRef.current > 1000) {
        lastShakeRef.current = now
        dirCountRef.current = 0
        if (bagRef.current) {
          const bagRect = bagRef.current.getBoundingClientRect()
          dropSeeds(bagRect.left + bagRect.width / 2)
        }
      }

      lastXRef.current = e.clientX
    },
    [isDragging, dropSeeds, containerRef, applyTransform],
  )



  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    velocityRef.current = []
    dirCountRef.current = 0
    springBack()
  }, [springBack])

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current)
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
        top: 16,
        left: "50%",
        padding: 8,
        transform: "translate(-50%, 0)",
        willChange: "transform",
        cursor: isDragging ? "grabbing" : "grab",
        filter: justDropped ? "brightness(1.05)" : "none",
        transition: "filter 0.2s ease",
      }}
      role="button"
      aria-label="Grab and shake the seed bag to plant seeds"
      tabIndex={0}
    >
      {/* Ink-wash bag */}
      <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
        <path d="M16 22 Q14 22 12 70 Q12 76 20 76 L44 76 Q52 76 52 70 L50 22 Z" fill="#d6cfc4" stroke="#3d3832" strokeWidth="1" strokeLinejoin="round" />
        <path d="M16 22 Q24 18 32 20 Q40 18 48 22" fill="none" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" />
        <path d="M26 20 Q28 16 32 18 Q36 16 38 20" fill="none" stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="32" y1="38" x2="32" y2="56" stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="26" y1="44" x2="38" y2="44" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <line x1="27" y1="50" x2="37" y2="50" stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        {/* Inner seeds shift with movement */}
        <circle data-inner-seed="" data-base-cx="28" data-factor="1" cx="28" cy="64" r="2.5" fill="#3d3832" opacity="0.15" />
        <circle data-inner-seed="" data-base-cx="34" data-factor="0.7" cx="34" cy="66" r="2" fill="#3d3832" opacity="0.12" />
        <circle data-inner-seed="" data-base-cx="24" data-factor="1.2" cx="24" cy="68" r="1.8" fill="#3d3832" opacity="0.1" />
        <circle data-inner-seed="" data-base-cx="38" data-factor="0.5" cx="38" cy="63" r="2.2" fill="#3d3832" opacity="0.13" />
      </svg>

      {/* Falling seeds -- originate from the bag opening at top */}
      {showSeeds && (
        <div className="absolute pointer-events-none" style={{ top: 80, left: "50%", transform: "translateX(-50%)" }}>
          {/* Seed 1 -- left arc */}
          <svg className="absolute animate-seed-drop-1" style={{ left: -6, top: 0 }} width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path d="M4 0 Q7 3 6 7 Q5 10 4 10 Q3 10 2 7 Q1 3 4 0Z" fill="#3d3832" opacity="0.85" />
          </svg>
          {/* Seed 2 -- right arc */}
          <svg className="absolute animate-seed-drop-2" style={{ left: 8, top: -2 }} width="7" height="9" viewBox="0 0 7 9" fill="none">
            <path d="M3.5 0 Q6 2.5 5.2 6 Q4.5 9 3.5 9 Q2.5 9 1.8 6 Q1 2.5 3.5 0Z" fill="#5a5347" opacity="0.8" />
          </svg>
          {/* Seed 3 -- center drop */}
          <svg className="absolute animate-seed-drop-3" style={{ left: 1, top: 2 }} width="7" height="10" viewBox="0 0 7 10" fill="none">
            <path d="M3.5 0 Q6.2 3 5.5 7 Q4.8 10 3.5 10 Q2.2 10 1.5 7 Q0.8 3 3.5 0Z" fill="#3d3832" opacity="0.9" />
          </svg>
          {/* Seed 4 -- far right */}
          <svg className="absolute animate-seed-drop-4" style={{ left: 14, top: 0 }} width="6" height="8" viewBox="0 0 6 8" fill="none">
            <path d="M3 0 Q5.2 2 4.5 5.5 Q4 8 3 8 Q2 8 1.5 5.5 Q0.8 2 3 0Z" fill="#5a5347" opacity="0.75" />
          </svg>
          {/* Seed 5 -- far left */}
          <svg className="absolute animate-seed-drop-5" style={{ left: -12, top: -1 }} width="6" height="8" viewBox="0 0 6 8" fill="none">
            <path d="M3 0 Q5 2.2 4.3 5.5 Q3.8 8 3 8 Q2.2 8 1.7 5.5 Q1 2.2 3 0Z" fill="#3d3832" opacity="0.7" />
          </svg>
        </div>
      )}

      {/* Hint -- fades in then out */}
      {!hasInteracted && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans tracking-widest uppercase whitespace-nowrap pointer-events-none animate-hint"
          style={{ bottom: -24 }}
        >
          grab & shake
        </p>
      )}
    </div>
  )
}
