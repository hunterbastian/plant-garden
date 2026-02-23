"use client"

import { useState, useCallback } from "react"

interface SeedBagProps {
  onShake: () => void
}

export function SeedBag({ onShake }: SeedBagProps) {
  const [isShaking, setIsShaking] = useState(false)
  const [shakeCount, setShakeCount] = useState(0)

  const handleShake = useCallback(() => {
    if (isShaking) return
    setIsShaking(true)
    setShakeCount((c) => c + 1)
    onShake()
    setTimeout(() => setIsShaking(false), 600)
  }, [isShaking, onShake])

  return (
    <button
      onClick={handleShake}
      className="group relative cursor-grab active:cursor-grabbing focus:outline-none"
      aria-label="Shake seed bag to plant seeds"
    >
      <div
        className={`transition-transform ${isShaking ? "animate-shake" : "group-hover:rotate-[-5deg]"}`}
      >
        {/* Bag body */}
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          {/* Bag top fold */}
          <path
            d="M15 25 L25 8 L55 8 L65 25 Z"
            fill="#c4956a"
            stroke="#8b6342"
            strokeWidth="1.5"
          />
          {/* Bag tie */}
          <rect x="32" y="20" width="16" height="6" rx="3" fill="#8b6342" />

          {/* Bag body */}
          <path
            d="M12 25 L10 85 Q10 95 20 95 L60 95 Q70 95 70 85 L68 25 Z"
            fill="#d4a574"
            stroke="#8b6342"
            strokeWidth="1.5"
          />

          {/* Bag texture lines */}
          <path d="M25 40 L25 80" stroke="#c4956a" strokeWidth="1" opacity="0.5" />
          <path d="M40 35 L40 85" stroke="#c4956a" strokeWidth="1" opacity="0.5" />
          <path d="M55 40 L55 80" stroke="#c4956a" strokeWidth="1" opacity="0.5" />

          {/* Seed icon on bag */}
          <ellipse cx="40" cy="58" rx="8" ry="10" fill="#8b6342" opacity="0.6" />
          <path d="M40 50 Q44 55 40 62" stroke="#d4a574" strokeWidth="1.5" fill="none" />

          {/* Little seeds peeking out top */}
          {shakeCount < 20 && (
            <>
              <circle cx="35" cy="22" r="2.5" fill="#6b4c2a" />
              <circle cx="42" cy="20" r="2" fill="#7a5a35" />
              <circle cx="48" cy="23" r="2.5" fill="#6b4c2a" />
            </>
          )}
        </svg>

        {/* Falling seeds animation */}
        {isShaking && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="animate-seed-fall-1 absolute h-2 w-2 rounded-full bg-[#6b4c2a]" />
            <div className="animate-seed-fall-2 absolute h-1.5 w-1.5 rounded-full bg-[#7a5a35] ml-2" />
            <div className="animate-seed-fall-3 absolute h-2 w-2 rounded-full bg-[#5c3d1f] -ml-2" />
          </div>
        )}
      </div>

      <p className="mt-2 text-xs font-medium text-muted-foreground select-none">
        {isShaking ? "Shaking!" : "Click to shake"}
      </p>
    </button>
  )
}
