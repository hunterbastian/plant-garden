"use client"

import { useState, useEffect, useRef, memo } from "react"

export type PlantStage = "seed" | "sprout" | "growing" | "blooming"
export type PlantType = "bamboo" | "bonsai" | "moss" | "orchid"

interface PlantProps {
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
  watered?: boolean
  glowing?: boolean
}

const COLORS: Record<PlantType, { stem: string; leaf: string; accent: string }> = {
  bamboo:  { stem: "#6b7a5e", leaf: "#7d8e6e", accent: "#7d8e6e" },
  bonsai:  { stem: "#5a4e42", leaf: "#6b7a5e", accent: "#8a7b6b" },
  moss:    { stem: "#6b7a5e", leaf: "#8a9e7a", accent: "#8a9e7a" },
  orchid:  { stem: "#6b7a5e", leaf: "#7d8e6e", accent: "#b8a0a0" },
}

const MAX_BAMBOO_SEGMENTS = 5

export const Plant = memo(function Plant({ x, stage, type, delay, watered, glowing }: PlantProps) {
  const [visible, setVisible] = useState(false)
  const [currentStage, setCurrentStage] = useState<PlantStage>("seed")
  const [wiggling, setWiggling] = useState(false)
  const [bambooSegments, setBambooSegments] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const bambooIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const c = COLORS[type]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setCurrentStage("seed")
    const t1 = setTimeout(() => setCurrentStage("sprout"), 600)
    const t2 = setTimeout(() => setCurrentStage("growing"), 1800)
    const t3 = setTimeout(() => setCurrentStage(stage), 3200)
    timersRef.current = [t1, t2, t3]
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  }, [visible, stage])

  // Bamboo keeps growing after blooming -- adds segments over time
  useEffect(() => {
    if (type !== "bamboo" || currentStage !== "blooming") return
    if (bambooIntervalRef.current) clearInterval(bambooIntervalRef.current)
    bambooIntervalRef.current = setInterval(() => {
      setBambooSegments((prev) => {
        if (prev >= MAX_BAMBOO_SEGMENTS) {
          if (bambooIntervalRef.current) clearInterval(bambooIntervalRef.current)
          return prev
        }
        return prev + 1
      })
    }, 4000)
    return () => { if (bambooIntervalRef.current) clearInterval(bambooIntervalRef.current) }
  }, [type, currentStage])

  const handleTap = () => {
    if (wiggling) return
    setWiggling(true)
    setTimeout(() => setWiggling(false), 500)
  }

  if (!visible) return null

  const isBambooGrown = type === "bamboo" && currentStage === "blooming"
  const extraH = isBambooGrown ? bambooSegments * 18 : 0
  const svgH = 56 + extraH
  const stemTop = isBambooGrown ? Math.max(18 - bambooSegments * 18, 2) : 18

  // Render bamboo segments
  const renderBambooSegments = () => {
    if (!isBambooGrown || bambooSegments === 0) return null
    const segs = []
    for (let s = 0; s < bambooSegments; s++) {
      const yBase = 18 - s * 18
      const yTop = yBase - 14
      const nodeY = yBase - 2
      segs.push(
        <g key={s} className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
          <line x1="18" y1={yBase} x2="18" y2={Math.max(yTop, 2)} stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1={nodeY} x2="20" y2={nodeY} stroke={c.stem} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d={`M18 ${yTop + 4} Q${12 - s} ${yTop} ${8 - s} ${yTop + 3}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M18 ${yTop + 4} Q${24 + s} ${yTop} ${28 + s} ${yTop + 3}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
          {s > 0 && (
            <>
              <path d={`M18 ${yTop + 8} Q${14 - s * 0.5} ${yTop + 5} ${11 - s * 0.5} ${yTop + 7}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
              <path d={`M18 ${yTop + 8} Q${22 + s * 0.5} ${yTop + 5} ${25 + s * 0.5} ${yTop + 7}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
            </>
          )}
        </g>
      )
    }
    return <>{segs}</>
  }

  return (
    <div
      className={`absolute bottom-0 ${wiggling ? "animate-plant-wiggle" : "animate-appear"} ${glowing ? "animate-water-glow" : ""}`}
      style={{ left: `${x}%`, transform: "translateX(-50%)", cursor: "pointer", pointerEvents: "auto" }}
      onClick={handleTap}
    >
      {watered && (
        <div className="absolute inset-0 pointer-events-none">
          <svg width="36" height="56" viewBox="0 0 36 56" className="overflow-visible animate-shimmer">
            <circle cx="12" cy="20" r="1.5" fill="#8aacbc" opacity="0.6">
              <animate attributeName="cy" values="20;18;20" dur="1.5s" fill="freeze" />
            </circle>
            <circle cx="24" cy="14" r="1" fill="#8aacbc" opacity="0.5">
              <animate attributeName="cy" values="14;12;14" dur="1.5s" fill="freeze" />
            </circle>
            <circle cx="18" cy="26" r="1.2" fill="#8aacbc" opacity="0.4">
              <animate attributeName="cy" values="26;23;26" dur="1.5s" fill="freeze" />
            </circle>
          </svg>
        </div>
      )}
      <svg
        width="36"
        height={svgH}
        viewBox={`0 0 36 ${svgH}`}
        className="overflow-visible"
        style={{ marginBottom: extraH > 0 ? -extraH : 0, transition: "height 0.8s ease-out, margin-bottom 0.8s ease-out" }}
      >
        {currentStage === "seed" && (
          <g className="animate-soft-fade">
            <ellipse cx="18" cy={svgH - 3} rx="3" ry="2" fill="#3d3832" opacity="0.5" />
          </g>
        )}
        {currentStage === "sprout" && (
          <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
            <line x1="18" y1={svgH} x2="18" y2={svgH - 12} stroke={c.stem} strokeWidth="1.2" strokeLinecap="round" />
            <path d={`M18 ${svgH - 10} Q14 ${svgH - 13} 13 ${svgH - 12}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 10} Q22 ${svgH - 13} 23 ${svgH - 12}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
        {currentStage === "growing" && (
          <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
            <path d={`M18 ${svgH} Q17 ${svgH - 16} 18 ${svgH - 28}`} fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />
            <path d={`M18 ${svgH - 14} Q12 ${svgH - 18} 10 ${svgH - 16}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 14} Q24 ${svgH - 18} 26 ${svgH - 16}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 22} Q13 ${svgH - 26} 11 ${svgH - 24}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 22} Q23 ${svgH - 26} 25 ${svgH - 24}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
        {currentStage === "blooming" && (
          <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
            {/* Main stem */}
            <path d={`M18 ${svgH} Q17 ${svgH - 20} 18 ${stemTop + extraH}`} fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" style={{ transition: "d 0.8s ease-out" }} />
            {/* Base leaves */}
            <path d={`M18 ${svgH - 12} Q11 ${svgH - 16} 9 ${svgH - 14}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 12} Q25 ${svgH - 16} 27 ${svgH - 14}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 20} Q12 ${svgH - 24} 10 ${svgH - 22}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
            <path d={`M18 ${svgH - 20} Q24 ${svgH - 24} 26 ${svgH - 22}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />

            {/* Bamboo segments that keep growing */}
            {type === "bamboo" && renderBambooSegments()}

            {/* Top crown for bamboo */}
            {type === "bamboo" && (
              <g className="animate-unfold">
                <path d={`M18 ${stemTop + extraH} Q14 ${stemTop + extraH - 8} 8 ${stemTop + extraH - 6}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
                <path d={`M18 ${stemTop + extraH} Q22 ${stemTop + extraH - 8} 28 ${stemTop + extraH - 6}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
                <path d={`M18 ${stemTop + extraH} Q16 ${stemTop + extraH - 10} 12 ${stemTop + extraH - 12}`} fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
                <path d={`M18 ${stemTop + extraH} Q20 ${stemTop + extraH - 10} 24 ${stemTop + extraH - 12}`} fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
                <path d={`M18 ${stemTop + extraH} L18 ${stemTop + extraH - 8}`} fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            )}

            {type === "bonsai" && (
              <g className="animate-unfold">
                <circle cx="18" cy={svgH - 40} r="8" fill={c.leaf} opacity="0.3" />
                <circle cx="14" cy={svgH - 44} r="5" fill={c.leaf} opacity="0.25" />
                <circle cx="22" cy={svgH - 44} r="5" fill={c.leaf} opacity="0.25" />
                <circle cx="18" cy={svgH - 46} r="4" fill={c.leaf} opacity="0.35" />
              </g>
            )}
            {type === "moss" && (
              <g className="animate-unfold">
                <circle cx="18" cy={svgH - 38} r="6" fill={c.accent} opacity="0.35" />
                <circle cx="14" cy={svgH - 40} r="4" fill={c.accent} opacity="0.3" />
                <circle cx="22" cy={svgH - 40} r="4" fill={c.accent} opacity="0.3" />
                <circle cx="18" cy={svgH - 42} r="3" fill={c.accent} opacity="0.4" />
              </g>
            )}
            {type === "orchid" && (
              <g className="animate-unfold">
                <ellipse cx="18" cy={svgH - 42} rx="4" ry="5" fill={c.accent} opacity="0.4" />
                <ellipse cx="14" cy={svgH - 44} rx="3" ry="4" fill={c.accent} opacity="0.3" transform={`rotate(-15 14 ${svgH - 44})`} />
                <ellipse cx="22" cy={svgH - 44} rx="3" ry="4" fill={c.accent} opacity="0.3" transform={`rotate(15 22 ${svgH - 44})`} />
                <circle cx="18" cy={svgH - 43} r="2" fill={c.accent} opacity="0.5" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
})
