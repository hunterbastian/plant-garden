"use client"

import { useState, useCallback } from "react"

interface SeedBagProps {
  onShake: () => void
}

export function SeedBag({ onShake }: SeedBagProps) {
  const [isShaking, setIsShaking] = useState(false)

  const handleShake = useCallback(() => {
    if (isShaking) return
    setIsShaking(true)
    onShake()
    setTimeout(() => setIsShaking(false), 700)
  }, [isShaking, onShake])

  return (
    <button
      onClick={handleShake}
      className="group relative cursor-grab active:cursor-grabbing focus:outline-none"
      aria-label="Shake seed bag to plant seeds"
    >
      <div
        className={`transition-transform ${isShaking ? "animate-tilt" : "group-hover:rotate-[-3deg]"}`}
      >
        {/* Minimal ink-wash style bag */}
        <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
          {/* Bag body - simple pouch shape */}
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
          {/* Simple kanji-like mark on bag */}
          <line x1="32" y1="38" x2="32" y2="56" stroke="#3d3832" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <line x1="26" y1="44" x2="38" y2="44" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <line x1="27" y1="50" x2="37" y2="50" stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        </svg>

        {/* Falling seeds */}
        {isShaking && (
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
    </button>
  )
}
