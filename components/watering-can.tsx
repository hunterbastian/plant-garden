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
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [tilt, setTilt] = useState(0)
  const [showDrops, setShowDrops] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [waterLevel, setWaterLevel] = useState(MAX_WATER)

  // Hold-to-pour state
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [isPouringAnim, setIsPouringAnim] = useState(false)

  // Refill state
  const [isNearPond, setIsNearPond] = useState(false)
  const [refillProgress, setRefillProgress] = useState(0)
  const [isRefilling, setIsRefilling] = useState(false)
  const [showRefillBubbles, setShowRefillBubbles] = useState(false)

  const canRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startCanRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>(0)
  const holdStartRef = useRef<number>(0)
  const holdRafRef = useRef<number>(0)
  const refillStartRef = useRef<number>(0)
  const refillRafRef = useRef<number>(0)
  const hasMoveRef = useRef(false)
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if can is near the pond (bottom-right of container)
  const checkNearPond = useCallback(() => {
    if (!containerRef.current || !canRef.current) return false
    const cRect = containerRef.current.getBoundingClientRect()
    const bRect = canRef.current.getBoundingClientRect()
    const canCenterX = bRect.left + bRect.width / 2
    const canCenterY = bRect.top + bRect.height / 2

    // Pond is at bottom-right: roughly right 16px, bottom 24px, 64x36
    const pondCenterX = cRect.right - 16 - 32
    const pondCenterY = cRect.bottom - 37 - 24
    const dx = canCenterX - pondCenterX
    const dy = canCenterY - pondCenterY
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < 70
  }, [containerRef])

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

  // Hold-progress loop (pour water)
  useEffect(() => {
    if (!isHolding || isNearPond) {
      if (!isNearPond) setHoldProgress(0)
      return
    }

    holdStartRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - holdStartRef.current
      const progress = Math.min(elapsed / HOLD_DURATION, 1)
      setHoldProgress(progress)

      if (progress >= 1) {
        triggerPour()
        setIsHolding(false)
        return
      }

      holdRafRef.current = requestAnimationFrame(tick)
    }

    holdRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(holdRafRef.current)
  }, [isHolding, isNearPond])

  // Refill-progress loop (near pond)
  useEffect(() => {
    if (!isRefilling) {
      setRefillProgress(0)
      return
    }

    refillStartRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - refillStartRef.current
      const progress = Math.min(elapsed / REFILL_DURATION, 1)
      setRefillProgress(progress)

      if (progress >= 1) {
        // Refill complete
        setWaterLevel(MAX_WATER)
        setIsRefilling(false)
        setShowRefillBubbles(true)
        setTimeout(() => setShowRefillBubbles(false), 800)
        return
      }

      refillRafRef.current = requestAnimationFrame(tick)
    }

    refillRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(refillRafRef.current)
  }, [isRefilling])

  const triggerPour = useCallback(() => {
    if (waterLevel <= 0) return

    setIsPouringAnim(true)
    setTilt(-35)
    setTimeout(() => {
      setShowDrops(true)
      setWaterLevel((prev) => Math.max(0, prev - 1))
      if (canRef.current) {
        const rect = canRef.current.getBoundingClientRect()
        onWater(rect.left + rect.width * 0.25)
      }
    }, 300)
    setTimeout(() => setShowDrops(false), 1100)
    setTimeout(() => {
      setTilt(0)
      setIsPouringAnim(false)
    }, 1200)
  }, [onWater, waterLevel])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPouringAnim) return
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animFrameRef.current)
      cancelAnimationFrame(holdRafRef.current)
      cancelAnimationFrame(refillRafRef.current)

      setIsDragging(true)
      setHasInteracted(true)
      hasMoveRef.current = false
      startPosRef.current = { x: e.clientX, y: e.clientY }
      startCanRef.current = { ...pos }

      // Check pond proximity immediately
      const nearPond = checkNearPond()
      setIsNearPond(nearPond)

      if (nearPond && waterLevel < MAX_WATER) {
        setIsRefilling(true)
        setIsHolding(false)
      } else if (!nearPond) {
        setIsHolding(true)
        setIsRefilling(false)
      }

      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos, isPouringAnim, checkNearPond, waterLevel],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || isPouringAnim) return

      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const totalMove = Math.sqrt(dx * dx + dy * dy)

      if (totalMove > 6) {
        hasMoveRef.current = true
        if (isHolding) setIsHolding(false)
        if (isRefilling) setIsRefilling(false)
        setIsNearPond(false)
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

      setPos({ x: newX, y: newY })

      // Clear existing pause timer
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)

      // Restart hold/refill after pause
      if (isDragging && !isPouringAnim && hasMoveRef.current) {
        moveTimeoutRef.current = setTimeout(() => {
          if (!isDragging || isPouringAnim) return
          const nearPond = checkNearPond()
          setIsNearPond(nearPond)
          if (nearPond && waterLevel < MAX_WATER) {
            setIsRefilling(true)
            setIsHolding(false)
          } else if (!nearPond) {
            setIsHolding(true)
            setIsRefilling(false)
          }
        }, 200)
      }
    },
    [isDragging, isPouringAnim, isHolding, isRefilling, containerRef, checkNearPond, waterLevel],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsHolding(false)
    setIsRefilling(false)
    setIsNearPond(false)
    setHoldProgress(0)
    setRefillProgress(0)
    cancelAnimationFrame(holdRafRef.current)
    cancelAnimationFrame(refillRafRef.current)
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current)
    if (!isPouringAnim) setTilt(0)
  }, [isPouringAnim])

  const waterDots = Array.from({ length: MAX_WATER }, (_, i) => i < waterLevel)

  // Which ring to show
  const showPourRing = isDragging && holdProgress > 0 && holdProgress < 1 && !isPouringAnim && !isNearPond
  const showRefillRing = isDragging && isRefilling && refillProgress > 0 && refillProgress < 1

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
        transition: isPouringAnim
          ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
          : isDragging
            ? "none"
            : "transform 0.15s ease-out",
        cursor: isPouringAnim ? "default" : isDragging ? "grabbing" : "grab",
        transformOrigin: "70% 40%",
      }}
      role="button"
      aria-label="Hold the watering can to water plants, or hold it near the pond to refill"
      tabIndex={0}
    >
      {/* Pour progress ring */}
      {showPourRing && (
        <svg
          className="absolute pointer-events-none"
          style={{ top: -8, right: -8, width: 36, height: 36 }}
          viewBox="0 0 36 36"
        >
          <circle cx="18" cy="18" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="2" opacity="0.4" />
          <circle
            cx="18" cy="18" r={CIRCLE_R}
            fill="none" stroke="#8aacbc" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={CIRCLE_C}
            strokeDashoffset={CIRCLE_C * (1 - holdProgress)}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.05s linear" }}
          />
          <path d="M18 12 Q18 18 14 20 Q16 24 18 24 Q20 24 22 20 Q18 18 18 12Z" fill="#8aacbc" opacity={0.3 + holdProgress * 0.5} />
        </svg>
      )}

      {/* Refill progress ring */}
      {showRefillRing && (
        <svg
          className="absolute pointer-events-none"
          style={{ top: -8, right: -8, width: 36, height: 36 }}
          viewBox="0 0 36 36"
        >
          <circle cx="18" cy="18" r={CIRCLE_R} fill="none" stroke="#d6cfc4" strokeWidth="2" opacity="0.4" />
          <circle
            cx="18" cy="18" r={CIRCLE_R}
            fill="none" stroke="#7aab8e" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={CIRCLE_C}
            strokeDashoffset={CIRCLE_C * (1 - refillProgress)}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.05s linear" }}
          />
          {/* Up arrow / fill icon */}
          <path d="M18 24 L18 13 M14 17 L18 13 L22 17" stroke="#7aab8e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4 + refillProgress * 0.5} />
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

      {/* Ink-wash watering can SVG */}
      <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
        <path d="M18 16 L16 44 Q16 48 20 48 L42 48 Q46 48 46 44 L44 16 Z" fill="#e8e2d8" stroke="#3d3832" strokeWidth="1" strokeLinejoin="round" />
        <path d={`M17 ${48 - waterLevel * 4} L17 44 Q17 47 21 47 L41 47 Q45 47 45 44 L45 ${48 - waterLevel * 4} Z`} fill="#b8c8d0" opacity="0.3" />
        <path d="M16 16 Q16 14 18 14 L44 14 Q46 14 46 16" fill="none" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" />
        <path d="M44 18 Q52 16 50 26 Q48 34 44 34" fill="none" stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M18 18 L6 8 Q4 6 4 8 L4 12 Q4 14 6 14 L16 20" fill="none" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="9" r="2" fill="none" stroke="#3d3832" strokeWidth="0.6" opacity="0.5" />
        <line x1="24" y1="24" x2="38" y2="24" stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.2" />
        <line x1="24" y1="28" x2="38" y2="28" stroke="#3d3832" strokeWidth="0.6" strokeLinecap="round" opacity="0.15" />
      </svg>

      {/* Water drops when pouring */}
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
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{ width: 3, height: 3, backgroundColor: filled ? "#8aacbc" : "#d6cfc4", opacity: filled ? 0.7 : 0.3 }}
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
