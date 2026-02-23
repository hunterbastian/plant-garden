"use client"

import { useState, useEffect } from "react"

export type PlantStage = "seed" | "sprout" | "growing" | "blooming"
export type PlantType = "bamboo" | "bonsai" | "moss" | "orchid"

interface PlantProps {
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
  watered?: boolean
}

// Muted, ink-wash palette
const COLORS: Record<PlantType, { stem: string; leaf: string; accent: string }> = {
  bamboo:  { stem: "#6b7a5e", leaf: "#7d8e6e", accent: "#7d8e6e" },
  bonsai:  { stem: "#5a4e42", leaf: "#6b7a5e", accent: "#8a7b6b" },
  moss:    { stem: "#6b7a5e", leaf: "#8a9e7a", accent: "#8a9e7a" },
  orchid:  { stem: "#6b7a5e", leaf: "#7d8e6e", accent: "#b8a0a0" },
}

export function Plant({ x, stage, type, delay, watered }: PlantProps) {
  const [visible, setVisible] = useState(false)
  const [currentStage, setCurrentStage] = useState<PlantStage>("seed")
  const c = COLORS[type]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    setCurrentStage("seed")
    const t1 = setTimeout(() => setCurrentStage("sprout"), 600)
    const t2 = setTimeout(() => setCurrentStage("growing"), 1800)
    const t3 = setTimeout(() => setCurrentStage(stage), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible, stage])

  if (!visible) return null

  return (
    <div
      className="absolute bottom-0 animate-appear"
      style={{ left: `${x}%`, transform: "translateX(-50%)" }}
    >
      {/* Watered shimmer */}
      {watered && (
        <div className="absolute inset-0 pointer-events-none animate-shimmer">
          <svg width="36" height="56" viewBox="0 0 36 56" className="overflow-visible">
            <circle cx="12" cy="20" r="1.5" fill="#8aacbc" opacity="0.6" />
            <circle cx="24" cy="14" r="1" fill="#8aacbc" opacity="0.5" />
            <circle cx="18" cy="26" r="1.2" fill="#8aacbc" opacity="0.4" />
            <circle cx="10" cy="32" r="0.8" fill="#8aacbc" opacity="0.5" />
            <circle cx="26" cy="30" r="1" fill="#8aacbc" opacity="0.3" />
          </svg>
        </div>
      )}
      <svg width="36" height="56" viewBox="0 0 36 56" className="overflow-visible">
        {/* Seed */}
        {currentStage === "seed" && (
          <g className="animate-soft-fade">
            <ellipse cx="18" cy="53" rx="3" ry="2" fill="#3d3832" opacity="0.5" />
          </g>
        )}

        {/* Sprout - single delicate line with two tiny leaves */}
        {currentStage === "sprout" && (
          <g className="animate-emerge" style={{ transformOrigin: "18px 56px" }}>
            <line x1="18" y1="56" x2="18" y2="44" stroke={c.stem} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M18 46 Q14 43 13 44" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 46 Q22 43 23 44" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Growing */}
        {currentStage === "growing" && (
          <g className="animate-emerge" style={{ transformOrigin: "18px 56px" }}>
            <path d="M18 56 Q17 40 18 28" fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 42 Q12 38 10 40" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 42 Q24 38 26 40" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 34 Q13 30 11 32" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 34 Q23 30 25 32" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Blooming */}
        {currentStage === "blooming" && (
          <g className="animate-emerge" style={{ transformOrigin: "18px 56px" }}>
            {/* Main stem */}
            <path d="M18 56 Q17 36 18 18" fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />

            {/* Leaves along stem */}
            <path d="M18 44 Q11 40 9 42" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 44 Q25 40 27 42" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 36 Q12 32 10 34" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d="M18 36 Q24 32 26 34" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />

            {/* Type-specific crown */}
            {type === "bamboo" && (
              <g className="animate-unfold">
                <path d="M18 18 Q14 10 8 12" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
                <path d="M18 18 Q22 10 28 12" fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
                <path d="M18 18 Q16 8 12 6" fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
                <path d="M18 18 Q20 8 24 6" fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
                <path d="M18 18 L18 10" fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            )}

            {type === "bonsai" && (
              <g className="animate-unfold">
                <circle cx="18" cy="16" r="8" fill={c.leaf} opacity="0.3" />
                <circle cx="14" cy="12" r="5" fill={c.leaf} opacity="0.25" />
                <circle cx="22" cy="12" r="5" fill={c.leaf} opacity="0.25" />
                <circle cx="18" cy="10" r="4" fill={c.leaf} opacity="0.35" />
              </g>
            )}

            {type === "moss" && (
              <g className="animate-unfold">
                <circle cx="18" cy="18" r="6" fill={c.accent} opacity="0.35" />
                <circle cx="14" cy="16" r="4" fill={c.accent} opacity="0.3" />
                <circle cx="22" cy="16" r="4" fill={c.accent} opacity="0.3" />
                <circle cx="18" cy="14" r="3" fill={c.accent} opacity="0.4" />
              </g>
            )}

            {type === "orchid" && (
              <g className="animate-unfold">
                <ellipse cx="18" cy="14" rx="4" ry="5" fill={c.accent} opacity="0.4" />
                <ellipse cx="14" cy="12" rx="3" ry="4" fill={c.accent} opacity="0.3" transform="rotate(-15 14 12)" />
                <ellipse cx="22" cy="12" rx="3" ry="4" fill={c.accent} opacity="0.3" transform="rotate(15 22 12)" />
                <circle cx="18" cy="13" r="2" fill={c.accent} opacity="0.5" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
