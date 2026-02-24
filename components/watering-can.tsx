"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface WateringCanProps {
  onWater: (canCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

const HOLD_DURATION = 4000
const REFILL_DURATION = 3000
const CIRCLE_R = 14
const CIRCLE_C = 2 * Math.PI * CIRCLE_R
const MAX_WATER = 6

export function WateringCan({ onWater, containerRef }: WateringCanProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showDrops, setShowDrops] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [waterLevel, setWaterLevel] = useState(MAX_WATER)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isPouringAnim, setIsPouringAnim] = useState(false)
  const [isNearPond, setIsNearPond] = useState(false)
  const [refillProgress, setRefillProgress] = useState(0)
  const [showRefillBubbles, setShowRefillBubbles] = useState(false)

  const canRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startCanRef = useRef({ x: 0, y: 0 })
  const posRef = useRef({ x: 0, y: 0 })
  const tiltRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const holdRafRef = useRef<number>(0)
  const refillRafRef = useRef<number>(0)
  const holdStartRef = useRef<number>(0)
  const refillStartRef = useRef<number>(0)
  const hasMoveRef = useRef(false)
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isHoldingRef = useRef(false)
  const isRefillingRef = useRef(false)
  const rafPendingRef = useRef(false)
  const waterLevelRef = useRef(MAX_WATER)

  // Direct DOM transforms
  const applyTransform = useCallback(() => {
    if (!canRef.current) return
    const { x, y } = posRef.current
    const t = tiltRef.current
    canRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${t}deg)`
  }, [])

  const checkNearPond = useCallback(() => {
    if (!containerRef.current || !canRef.current) return false
    const cRect = containerRef.current.getBoundingClientRect()
    const bRect = canRef.current.getBoundingClientRect()
    const cx = bRect.left + bRect.width / 2
    const cy = bRect.top + bRect.height / 2
    const px = cRect.right - 48
    const py = cRect.bottom - 61
    const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2)
    return dist < 70
  }, [containerRef])

  // Spring-back
  const springBack = useCallback(() => {
    const sx = posRef.current.x
    const sy = posRef.current.y
    const st = tiltRef.current
    const start = performance.now()
    const dur = 500

    const animate = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const s = 1 - (1 + 5 * t) * Math.exp(-5 * t)
      posRef.current = { x: sx * (1 - s), y: sy * (1 - s) }
      tiltRef.current = st * (1 - s)
      applyTransform()
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        posRef.current = { x: 0, y: 0 }
        tiltRef.current = 0
        applyTransform()
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [applyTransform])

  // Tilt pour animation
  const tiltPour = useCallback(() => {
    const start = performance.now()
    const pourDur = 500
    const returnDur = 400
    const totalDur = pourDur + 600 + returnDur

    const animate = (now: number) => {
      const elapsed = now - start
      if (elapsed < pourDur) {
        const t = elapsed / pourDur
        const eased = 1 - Math.pow(1 - t, 3)
        tiltRef.current = -35 * eased
      } else if (elapsed < pourDur + 600) {
        tiltRef.current = -35
      } else {
        const t = (elapsed - pourDur - 600) / returnDur
        const eased = 1 - Math.pow(1 - Math.min(t, 1), 3)
        tiltRef.current = -35 * (1 - eased)
      }
      applyTransform()
      if (elapsed < totalDur) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        tiltRef.current = 0
        applyTransform()
        setIsPouringAnim(false)
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [applyTransform])

  const triggerPour = useCallback(() => {
    if (waterLevelRef.current <= 0) return
    setIsPouringAnim(true)
    tiltPour()
    setTimeout(() => {
      setShowDrops(true)
      waterLevelRef.current = Math.max(0, waterLevelRef.current - 1)
      setWaterLevel(waterLevelRef.current)
      if (canRef.current) {
        const rect = canRef.current.getBoundingClientRect()
        onWater(rect.left + rect.width * 0.25)
      }
    }, 400)
    setTimeout(() => setShowDrops(false), 1200)
  }, [onWater, tiltPour])

  // Hold-to-pour rAF loop
  useEffect(() => {
    if (!isHoldingRef.current || isNearPond) {
      cancelAnimationFrame(holdRafRef.current)
      return
    }

    holdStartRef.current = performance.now()
    const tick = (now: number) => {
      if (!isHoldingRef.current) return
      const p = Math.min((now - holdStartRef.current) / HOLD_DURATION, 1)
      setHoldProgress(p)
      if (p >= 1) {
        isHoldingRef.current = false
        setHoldProgress(0)
        triggerPour()
        return
      }
      holdRafRef.current = requestAnimationFrame(tick)
    }
    holdRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(holdRafRef.current)
  }, [isHoldingRef.current, isNearPond, triggerPour])

  // Refill rAF loop
  useEffect(() => {
    if (!isRefillingRef.current) {
      cancelAnimationFrame(refillRafRef.current)
      return
    }

    refillStartRef.current = performance.now()
    const tick = (now: number) => {
      if (!isRefillingRef.current) return
      const p = Math.min((now - refillStartRef.current) / REFILL_DURATION, 1)
      setRefillProgress(p)
      if (p >= 1) {
        isRefillingRef.current = false
        waterLevelRef.current = MAX_WATER
        setWaterLevel(MAX_WATER)
        setRefillProgress(0)
        setShowRefillBubbles(true)
        setTimeout(() => setShowRefillBubbles(false), 800)
        return
      }
      refillRafRef.current = requestAnimationFrame(tick)
    }
    refillRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(refillRafRef.current)
  }, [isRefillingRef.current])

  const startHoldOrRefill = useCallback(() => {
    const near = checkNearPond()
    setIsNearPond(near)
    if (near && waterLevelRef.current < MAX_WATER) {
      isRefillingRef.current = true
      isHoldingRef.current = false
      setRefillProgress(0.001) // trigger effect
    } else if (!near) {
      isHoldingRef.current = true
      isRefillingRef.current = false
      setHoldProgress(0.001)
    }
  }, [checkNearPond])

  const stopHoldAndRefill = useCallback(() => {
    isHoldingRef.current = false
    isRefillingRef.current = false
    setHoldProgress(0)
    setRefillProgress(0)
    setIsNearPond(false)
    cancelAnimationFrame(holdRafRef.current)
    cancelAnimationFrame(refillRafRef.current)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPouringAnim) return
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animFrameRef.current)
      stopHoldAndRefill()
      setIsDragging(true)
      setHasInteracted(true)
      hasMoveRef.current = false
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startCanRef.current = { ...posRef.current }
      startHoldOrRefill()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isPouringAnim, stopHoldAndRefill, startHoldOrRefill],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || isPouringAnim) return

      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const totalMove = Math.sqrt(dx * dx + dy * dy)

      if (totalMove > 6) {
        hasMoveRef.current = true
        stopHoldAndRefill()
      }

      let newX = startCanRef.current.x + dx
      let newY = startCanRef.current.y + dy

      if (containerRef.current && canRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const bRect = canRef.current.getBoundingClientRect()
        const bagW = bRect.width
        const bagH = bRect.height
        const defaultLeft = cRect.width - 16 - bagW
        const defaultTop = 16
        const minX = -(defaultLeft - 4)
        const maxX = cRect.width - defaultLeft - bagW + 4
        const minY = -defaultTop + 4
        const maxY = cRect.height - defaultTop - bagH - 4
        newX = Math.max(minX, Math.min(maxX, newX))
        newY = Math.max(minY, Math.min(maxY, newY))
      }

      posRef.current = { x: newX, y: newY }

      if (!rafPendingRef.current) {
        rafPendingRef.current = true
        requestAnimationFrame(() => {
          applyTransform()
          rafPendingRef.current = false
        })
      }

      // Restart hold/refill after pause
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
      if (hasMoveRef.current) {
        moveTimeoutRef.current = setTimeout(() => {
          if (!isDragging || isPouringAnim) return
          startHoldOrRefill()
        }, 200)
      }
    },
    [isDragging, isPouringAnim, containerRef, applyTransform, stopHoldAndRefill, startHoldOrRefill],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    stopHoldAndRefill()
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
    if (!isPouringAnim) springBack()
  }, [isPouringAnim, stopHoldAndRefill, springBack])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      cancelAnimationFrame(holdRafRef.current)
      cancelAnimationFrame(refillRafRef.current)
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
    }
  }, [])

  const waterDots = Array.from({ length: MAX_WATER }, (_, i) => i < waterLevel)
  const showPourRing = isDragging && holdProgress > 0 && holdProgress < 1 && !isPouringAnim && !isNearPond
  const showRefillRing = isDragging && refillProgress > 0 && refillProgress < 1

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
        willChange: "transform",
        cursor: isPouringAnim ? "default" : isDragging ? "grabbing" : "grab",
        transformOrigin: "70% 40%",
      }}
      role="button"
      aria-label="Hold the watering can to water plants, or hold near the pond to refill"
      tabIndex={0}
    >
      {/* Pour progress ring */}
      {showPourRing && (
        <svg
          className="absolute pointer-events-none"
          style={{ top: -10, right: -10, width: 38, height: 38, opacity: 0.5 + holdProgress * 0.5 }}
          viewBox="0 0 38 38"
        >
          <circle cx="19" cy="19" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="1.5" opacity="0.5" />
          <circle
            cx="19" cy="19" r={CIRCLE_R}
            fill="none" stroke="#8aacbc" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={CIRCLE_C}
            strokeDashoffset={CIRCLE_C * (1 - holdProgress)}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
          <path d="M19 13 Q19 19 15 21 Q17 25 19 25 Q21 25 23 21 Q19 19 19 13Z" fill="#8aacbc" opacity={0.2 + holdProgress * 0.4} />
        </svg>
      )}

      {/* Refill progress ring */}
      {showRefillRing && (
        <svg
          className="absolute pointer-events-none"
          style={{ top: -10, right: -10, width: 38, height: 38, opacity: 0.5 + refillProgress * 0.5 }}
          viewBox="0 0 38 38"
        >
          <circle cx="19" cy="19" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="1.5" opacity="0.5" />
          <circle
            cx="19" cy="19" r={CIRCLE_R}
            fill="none" stroke="#7aab8e" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={CIRCLE_C}
            strokeDashoffset={CIRCLE_C * (1 - refillProgress)}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
          <path d="M19 25 L19 14 M15 18 L19 14 L23 18" stroke="#7aab8e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3 + refillProgress * 0.5} />
        </svg>
      )}

      {/* Refill bubbles */}
      {showRefillBubbles && (
        <div className="absolute pointer-events-none" style={{ bottom: 4, left: "50%", transform: "translateX(-50%)" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full animate-soft-fade"
              style={{
                width: 4 - i,
                height: 4 - i,
                backgroundColor: "#8aacbc",
                opacity: 0.5,
                left: (i - 1) * 8,
                bottom: i * 6,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ink-wash watering can */}
      <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
        <path d="M18 16 L16 44 Q16 48 20 48 L42 48 Q46 48 46 44 L44 16 Z" fill="#e8e2d8" stroke="#3d3832" strokeWidth="1" strokeLinejoin="round" />
        <path d={`M17 ${48 - waterLevel * 4} L17 44 Q17 47 21 47 L41 47 Q45 47 45 44 L45 ${48 - waterLevel * 4} Z`} fill="#b8c8d0" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.35;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M16 16 Q16 14 18 14 L44 14 Q46 14 46 16" fill="none" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" />
        <path d="M44 18 Q52 16 50 26 Q48 34 44 34" fill="none" stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M18 18 L6 8 Q4 6 4 8 L4 12 Q4 14 6 14 L16 20" fill="none" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="9" r="2" fill="none" stroke="#3d3832" strokeWidth="0.6" opacity="0.5" />
        <line x1="24" y1="24" x2="38" y2="24" stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.2" />
        <line x1="24" y1="28" x2="38" y2="28" stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.15" />
      </svg>

      {/* Water drops */}
      {showDrops && (
        <div className="absolute pointer-events-none" style={{ top: 8, left: 0 }}>
          <div className="animate-water-drop-1 absolute rounded-full" style={{ height: 4, width: 3, backgroundColor: "#8aacbc", opacity: 0.7 }} />
          <div className="animate-water-drop-2 absolute rounded-full" style={{ height: 3, width: 2, backgroundColor: "#8aacbc", opacity: 0.6, marginLeft: 6 }} />
          <div className="animate-water-drop-3 absolute rounded-full" style={{ height: 4, width: 3, backgroundColor: "#8aacbc", opacity: 0.5, marginLeft: -4 }} />
          <div className="animate-water-drop-4 absolute rounded-full" style={{ height: 3, width: 2, backgroundColor: "#8aacbc", opacity: 0.6, marginLeft: 2 }} />
        </div>
      )}

      {/* Water level dots with animated transitions */}
      <div className="absolute flex gap-0.5" style={{ bottom: 2, left: "50%", transform: "translateX(-50%)" }}>
        {waterDots.map((filled, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 3,
              height: 3,
              backgroundColor: filled ? "#8aacbc" : "#d6cfc4",
              opacity: filled ? 0.7 : 0.3,
              transition: `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s`,
              transform: filled ? "scale(1)" : "scale(0.7)",
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
          hold to water
        </p>
      )}
    </div>
  )
}
