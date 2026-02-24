"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface WateringCanProps {
  onWater: (canCenterX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  onNearPondChange?: (near: boolean) => void
  onPouringChange?: (pouring: boolean) => void
  onPositionChange?: (x: number) => void
}

const HOLD_DURATION = 2000
const REFILL_DURATION = 3000
const CIRCLE_R = 14
const CIRCLE_C = 2 * Math.PI * CIRCLE_R
const MAX_WATER = 6

export function WateringCan({ onWater, containerRef, onNearPondChange, onPouringChange, onPositionChange }: WateringCanProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showDrops, setShowDrops] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [waterLevel, setWaterLevel] = useState(MAX_WATER)
  const [isPouringAnim, setIsPouringAnim] = useState(false)
  const [showRefillBubbles, setShowRefillBubbles] = useState(false)

  const canRef = useRef<HTMLDivElement>(null)
  const holdRingRef = useRef<SVGCircleElement>(null)
  const holdRingSvgRef = useRef<SVGSVGElement>(null)
  const refillRingRef = useRef<SVGCircleElement>(null)
  const refillRingSvgRef = useRef<SVGSVGElement>(null)
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
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)
  const isRefillingRef = useRef(false)
  const isNearPondRef = useRef(false)
  const rafPendingRef = useRef(false)
  const waterLevelRef = useRef(MAX_WATER)
  const isDraggingRef = useRef(false)
  const pourTiltAnimRef = useRef<number>(0)

  // Direct DOM transform -- no re-render
  const applyTransform = useCallback(() => {
    if (!canRef.current) return
    const { x, y } = posRef.current
    const t = tiltRef.current
    canRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${t}deg)`
  }, [])

  // Update hold/refill ring via DOM ref -- no setState
  const updateHoldRing = useCallback((progress: number) => {
    if (holdRingSvgRef.current) {
      holdRingSvgRef.current.style.display = progress > 0 ? "block" : "none"
      holdRingSvgRef.current.style.opacity = String(0.5 + progress * 0.5)
    }
    if (holdRingRef.current) {
      holdRingRef.current.setAttribute("stroke-dashoffset", String(CIRCLE_C * (1 - progress)))
    }
  }, [])

  const updateRefillRing = useCallback((progress: number) => {
    if (refillRingSvgRef.current) {
      refillRingSvgRef.current.style.display = progress > 0 ? "block" : "none"
      refillRingSvgRef.current.style.opacity = String(0.5 + progress * 0.5)
    }
    if (refillRingRef.current) {
      refillRingRef.current.setAttribute("stroke-dashoffset", String(CIRCLE_C * (1 - progress)))
    }
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
      if (t < 1) animFrameRef.current = requestAnimationFrame(animate)
      else { posRef.current = { x: 0, y: 0 }; tiltRef.current = 0; applyTransform() }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [applyTransform])

  const tiltPour = useCallback(() => {
    const startTilt = tiltRef.current
    const start = performance.now()
    const pourDur = 500, holdDur = 600, returnDur = 400
    const totalDur = pourDur + holdDur + returnDur

    const animate = (now: number) => {
      const elapsed = now - start
      let targetTilt = 0
      if (elapsed < pourDur) {
        const t = elapsed / pourDur
        targetTilt = startTilt + (-35 - startTilt) * (1 - Math.pow(1 - t, 3))
      } else if (elapsed < pourDur + holdDur) {
        targetTilt = -35
      } else {
        const t = Math.min((elapsed - pourDur - holdDur) / returnDur, 1)
        targetTilt = -35 * (1 - (1 - Math.pow(1 - t, 3)))
      }
      tiltRef.current = targetTilt
      applyTransform()
      if (elapsed < totalDur) {
        pourTiltAnimRef.current = requestAnimationFrame(animate)
      } else {
        tiltRef.current = 0
        applyTransform()
        setIsPouringAnim(false)
        onPouringChange?.(false)
      }
    }
    pourTiltAnimRef.current = requestAnimationFrame(animate)
  }, [applyTransform, onPouringChange])

  const triggerPour = useCallback(() => {
    if (waterLevelRef.current <= 0) return
    setIsPouringAnim(true)
    onPouringChange?.(true)
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
  }, [onWater, tiltPour, onPouringChange])

  // Hold-to-pour rAF loop -- uses ref-based ring updates (no setState)
  const startHoldLoop = useCallback(() => {
    holdStartRef.current = performance.now()
    const tick = (now: number) => {
      if (!isHoldingRef.current) { updateHoldRing(0); return }
      const p = Math.min((now - holdStartRef.current) / HOLD_DURATION, 1)
      updateHoldRing(p)
      if (p >= 1) {
        isHoldingRef.current = false
        updateHoldRing(0)
        triggerPour()
        return
      }
      holdRafRef.current = requestAnimationFrame(tick)
    }
    holdRafRef.current = requestAnimationFrame(tick)
  }, [triggerPour, updateHoldRing])

  const startRefillLoop = useCallback(() => {
    refillStartRef.current = performance.now()
    const tick = (now: number) => {
      if (!isRefillingRef.current) { updateRefillRing(0); return }
      const p = Math.min((now - refillStartRef.current) / REFILL_DURATION, 1)
      updateRefillRing(p)
      if (p >= 1) {
        isRefillingRef.current = false
        updateRefillRing(0)
        waterLevelRef.current = MAX_WATER
        setWaterLevel(MAX_WATER)
        setShowRefillBubbles(true)
        setTimeout(() => setShowRefillBubbles(false), 800)
        return
      }
      refillRafRef.current = requestAnimationFrame(tick)
    }
    refillRafRef.current = requestAnimationFrame(tick)
  }, [updateRefillRing])

  const startHoldOrRefill = useCallback(() => {
    const near = checkNearPond()
    isNearPondRef.current = near
    onNearPondChange?.(near)
    if (near && waterLevelRef.current < MAX_WATER) {
      isRefillingRef.current = true
      isHoldingRef.current = false
      startRefillLoop()
    } else if (!near) {
      isHoldingRef.current = true
      isRefillingRef.current = false
      startHoldLoop()
    }
  }, [checkNearPond, onNearPondChange, startHoldLoop, startRefillLoop])

  const stopHoldAndRefill = useCallback(() => {
    isHoldingRef.current = false
    isRefillingRef.current = false
    updateHoldRing(0)
    updateRefillRing(0)
    isNearPondRef.current = false
    onNearPondChange?.(false)
    cancelAnimationFrame(holdRafRef.current)
    cancelAnimationFrame(refillRafRef.current)
  }, [onNearPondChange, updateHoldRing, updateRefillRing])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animFrameRef.current)
      stopHoldAndRefill()
      setIsDragging(true)
      isDraggingRef.current = true
      setHasInteracted(true)
      hasMoveRef.current = false
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startCanRef.current = { ...posRef.current }
      startHoldOrRefill()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [stopHoldAndRefill, startHoldOrRefill],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const totalMove = Math.sqrt(dx * dx + dy * dy)

      if (totalMove > 6) {
        hasMoveRef.current = true
        if (!isPouringAnim) stopHoldAndRefill()
      }

      let newX = startCanRef.current.x + dx
      let newY = startCanRef.current.y + dy

      if (containerRef.current && canRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const bRect = canRef.current.getBoundingClientRect()
        const bagW = bRect.width, bagH = bRect.height
        const defaultLeft = cRect.width - 16 - bagW
        const defaultTop = 16
        newX = Math.max(-(defaultLeft - 4), Math.min(cRect.width - defaultLeft - bagW + 4, newX))
        newY = Math.max(-defaultTop + 4, Math.min(cRect.height - defaultTop - bagH - 4, newY))
      }

      posRef.current = { x: newX, y: newY }
      if (!rafPendingRef.current) {
        rafPendingRef.current = true
        requestAnimationFrame(() => { applyTransform(); rafPendingRef.current = false })
      }

      if (canRef.current) {
        const rect = canRef.current.getBoundingClientRect()
        onPositionChange?.(rect.left + rect.width / 2)
      }

      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
      if (hasMoveRef.current && !isPouringAnim) {
        moveTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current) return
          startHoldOrRefill()
        }, 200)
      }
    },
    [isDragging, isPouringAnim, containerRef, applyTransform, stopHoldAndRefill, startHoldOrRefill, onPositionChange],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
    stopHoldAndRefill()
    onPouringChange?.(false)
    onPositionChange?.(0)
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
    if (!isPouringAnim) springBack()
  }, [isPouringAnim, stopHoldAndRefill, springBack, onPouringChange, onPositionChange])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      cancelAnimationFrame(holdRafRef.current)
      cancelAnimationFrame(refillRafRef.current)
      cancelAnimationFrame(pourTiltAnimRef.current)
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
    }
  }, [])

  const waterDots = Array.from({ length: MAX_WATER }, (_, i) => i < waterLevel)

  return (
    <div
      ref={canRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-20 touch-none select-none"
      style={{ top: 16, right: 16, padding: 8, willChange: "transform", cursor: isDragging ? "grabbing" : "grab", transformOrigin: "70% 40%" }}
      role="button"
      aria-label="Hold the watering can to water plants, or hold near the pond to refill"
      tabIndex={0}
    >
      {/* Hold progress ring -- updated via ref, not state */}
      <svg
        ref={holdRingSvgRef}
        className="absolute pointer-events-none"
        style={{ top: -10, right: -10, width: 38, height: 38, display: "none" }}
        viewBox="0 0 38 38"
      >
        <circle cx="19" cy="19" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="1.5" opacity="0.5" />
        <circle
          ref={holdRingRef}
          cx="19" cy="19" r={CIRCLE_R}
          fill="none" stroke="#8aacbc" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={CIRCLE_C}
          strokeDashoffset={CIRCLE_C}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* Refill progress ring -- updated via ref, not state */}
      <svg
        ref={refillRingSvgRef}
        className="absolute pointer-events-none"
        style={{ top: -10, right: -10, width: 38, height: 38, display: "none" }}
        viewBox="0 0 38 38"
      >
        <circle cx="19" cy="19" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="1.5" opacity="0.5" />
        <circle
          ref={refillRingRef}
          cx="19" cy="19" r={CIRCLE_R}
          fill="none" stroke="#7aab8e" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={CIRCLE_C}
          strokeDashoffset={CIRCLE_C}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* Refill bubbles */}
      {showRefillBubbles && (
        <div className="absolute pointer-events-none" style={{ bottom: 4, left: "50%", transform: "translateX(-50%)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute rounded-full animate-soft-fade"
              style={{ width: 4 - i, height: 4 - i, backgroundColor: "#8aacbc", opacity: 0.5, left: (i - 1) * 8, bottom: i * 6, animationDelay: `${i * 0.15}s` }}
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

      {/* Water level dots */}
      <div className="absolute flex gap-0.5" style={{ bottom: 2, left: "50%", transform: "translateX(-50%)" }}>
        {waterDots.map((filled, i) => (
          <div key={i} className="rounded-full"
            style={{ width: 3, height: 3, backgroundColor: filled ? "#8aacbc" : "#d6cfc4", opacity: filled ? 0.7 : 0.3, transition: `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s`, transform: filled ? "scale(1)" : "scale(0.7)" }}
          />
        ))}
      </div>

      {/* Hint */}
      {!hasInteracted && (
        <p className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans tracking-widest uppercase whitespace-nowrap pointer-events-none animate-hint" style={{ bottom: -20, fontSize: 9, animationDelay: "1s" }}>
          hold to water
        </p>
      )}
    </div>
  )
}
