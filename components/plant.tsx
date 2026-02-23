"use client"

import { useState, useEffect } from "react"

export type PlantStage = "seed" | "sprout" | "growing" | "blooming"
export type PlantType = "flower" | "tulip" | "succulent" | "fern"

interface PlantProps {
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
}

const PLANT_COLORS: Record<PlantType, { stem: string; leaf: string; bloom: string }> = {
  flower: { stem: "#5a8a3c", leaf: "#6b9e4a", bloom: "#e87461" },
  tulip: { stem: "#4a7a32", leaf: "#5c8e40", bloom: "#d65db1" },
  succulent: { stem: "#6b9e4a", leaf: "#82b85e", bloom: "#82b85e" },
  fern: { stem: "#3d7a3a", leaf: "#4e9648", bloom: "#4e9648" },
}

export function Plant({ x, stage, type, delay }: PlantProps) {
  const [visible, setVisible] = useState(false)
  const [currentStage, setCurrentStage] = useState<PlantStage>("seed")
  const colors = PLANT_COLORS[type]

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    setCurrentStage("seed")
    const t1 = setTimeout(() => setCurrentStage("sprout"), 800)
    const t2 = setTimeout(() => setCurrentStage("growing"), 2000)
    const t3 = setTimeout(() => setCurrentStage(stage), 3500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [visible, stage])

  if (!visible) return null

  return (
    <div
      className="absolute bottom-0 animate-plant-appear"
      style={{ left: `${x}%`, transform: "translateX(-50%)" }}
    >
      <svg width="40" height="60" viewBox="0 0 40 60" className="overflow-visible">
        {/* Seed in soil */}
        {currentStage === "seed" && (
          <g className="animate-fade-in">
            <ellipse cx="20" cy="56" rx="4" ry="3" fill="#6b4c2a" />
          </g>
        )}

        {/* Sprout */}
        {currentStage === "sprout" && (
          <g className="animate-grow-up" style={{ transformOrigin: "20px 58px" }}>
            <line x1="20" y1="58" x2="20" y2="45" stroke={colors.stem} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="16" cy="44" rx="4" ry="2.5" fill={colors.leaf} transform="rotate(-20 16 44)" />
            <ellipse cx="24" cy="44" rx="4" ry="2.5" fill={colors.leaf} transform="rotate(20 24 44)" />
          </g>
        )}

        {/* Growing */}
        {currentStage === "growing" && (
          <g className="animate-grow-up" style={{ transformOrigin: "20px 58px" }}>
            <line x1="20" y1="58" x2="20" y2="30" stroke={colors.stem} strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="13" cy="40" rx="6" ry="3" fill={colors.leaf} transform="rotate(-25 13 40)" />
            <ellipse cx="27" cy="40" rx="6" ry="3" fill={colors.leaf} transform="rotate(25 27 40)" />
            <ellipse cx="14" cy="33" rx="5" ry="2.5" fill={colors.leaf} transform="rotate(-15 14 33)" />
            <ellipse cx="26" cy="33" rx="5" ry="2.5" fill={colors.leaf} transform="rotate(15 26 33)" />
          </g>
        )}

        {/* Blooming */}
        {currentStage === "blooming" && (
          <g className="animate-grow-up" style={{ transformOrigin: "20px 58px" }}>
            <line x1="20" y1="58" x2="20" y2="20" stroke={colors.stem} strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="12" cy="42" rx="6" ry="3" fill={colors.leaf} transform="rotate(-25 12 42)" />
            <ellipse cx="28" cy="42" rx="6" ry="3" fill={colors.leaf} transform="rotate(25 28 42)" />
            <ellipse cx="13" cy="34" rx="5" ry="2.5" fill={colors.leaf} transform="rotate(-15 13 34)" />
            <ellipse cx="27" cy="34" rx="5" ry="2.5" fill={colors.leaf} transform="rotate(15 27 34)" />

            {type === "flower" && (
              <g className="animate-bloom">
                <circle cx="20" cy="16" r="4" fill={colors.bloom} />
                <circle cx="15" cy="13" r="3.5" fill={colors.bloom} opacity="0.8" />
                <circle cx="25" cy="13" r="3.5" fill={colors.bloom} opacity="0.8" />
                <circle cx="17" cy="18" r="3.5" fill={colors.bloom} opacity="0.8" />
                <circle cx="23" cy="18" r="3.5" fill={colors.bloom} opacity="0.8" />
                <circle cx="20" cy="15" r="2.5" fill="#f5c542" />
              </g>
            )}

            {type === "tulip" && (
              <g className="animate-bloom">
                <path d="M15 18 Q20 4 25 18 Z" fill={colors.bloom} />
                <path d="M16 18 Q20 6 24 18 Z" fill={colors.bloom} opacity="0.7" />
              </g>
            )}

            {type === "succulent" && (
              <g className="animate-bloom">
                <ellipse cx="20" cy="22" rx="7" ry="5" fill={colors.bloom} />
                <ellipse cx="16" cy="18" rx="5" ry="4" fill={colors.bloom} opacity="0.8" transform="rotate(-20 16 18)" />
                <ellipse cx="24" cy="18" rx="5" ry="4" fill={colors.bloom} opacity="0.8" transform="rotate(20 24 18)" />
                <ellipse cx="20" cy="15" rx="4" ry="3" fill={colors.leaf} opacity="0.9" />
              </g>
            )}

            {type === "fern" && (
              <g className="animate-bloom">
                <ellipse cx="10" cy="26" rx="5" ry="2" fill={colors.leaf} transform="rotate(-35 10 26)" />
                <ellipse cx="30" cy="26" rx="5" ry="2" fill={colors.leaf} transform="rotate(35 30 26)" />
                <ellipse cx="12" cy="20" rx="4.5" ry="1.8" fill={colors.leaf} transform="rotate(-25 12 20)" />
                <ellipse cx="28" cy="20" rx="4.5" ry="1.8" fill={colors.leaf} transform="rotate(25 28 20)" />
                <ellipse cx="14" cy="14" rx="4" ry="1.5" fill={colors.leaf} transform="rotate(-15 14 14)" />
                <ellipse cx="26" cy="14" rx="4" ry="1.5" fill={colors.leaf} transform="rotate(15 26 14)" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
