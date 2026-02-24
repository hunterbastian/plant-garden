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
  bamboo: { stem: "#5c7a4a", leaf: "#6b8e5a", accent: "#7d9e6e" },
  bonsai: { stem: "#5a4e42", leaf: "#6b7a5e", accent: "#8a7b6b" },
  moss:   { stem: "#6b7a5e", leaf: "#8a9e7a", accent: "#8a9e7a" },
  orchid: { stem: "#6b7a5e", leaf: "#7d8e6e", accent: "#b8a0a0" },
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
  const segH = 20
  const extraH = isBambooGrown ? bambooSegments * segH : 0
  const svgH = 56 + extraH

  // --- Bamboo culm renderer ---
  // Each culm segment: tapered rect (wider at base, thinner at top), node ring, leaf cluster
  const renderBambooCulm = () => {
    // Total segments: 3 base + growing segments
    const totalSegs = 3 + bambooSegments
    const baseY = svgH // ground
    const baseWidth = 4
    const taperRate = 0.35 // width decrease per segment

    const elements = []

    for (let i = 0; i < totalSegs; i++) {
      const yBottom = baseY - i * segH
      const yTop = yBottom - segH
      const wBottom = Math.max(baseWidth - i * taperRate, 1.4)
      const wTop = Math.max(baseWidth - (i + 1) * taperRate, 1.2)
      const cx = 18
      const isGrowth = i >= 3

      elements.push(
        <g key={`seg-${i}`} className={isGrowth ? "animate-emerge" : ""} style={isGrowth ? { transformOrigin: `18px ${svgH}px` } : undefined}>
          {/* Culm segment -- tapered shape */}
          <path
            d={`M${cx - wBottom / 2} ${yBottom} L${cx - wTop / 2} ${yTop} L${cx + wTop / 2} ${yTop} L${cx + wBottom / 2} ${yBottom} Z`}
            fill={c.stem}
            opacity={0.7 - i * 0.025}
          />
          {/* Inner highlight -- gives hollow bamboo tube feel */}
          <path
            d={`M${cx - wBottom / 2 + 0.6} ${yBottom - 1} L${cx - wTop / 2 + 0.5} ${yTop + 1} L${cx + wTop / 2 - 0.5} ${yTop + 1} L${cx + wBottom / 2 - 0.6} ${yBottom - 1} Z`}
            fill={c.accent}
            opacity={0.15}
          />
          {/* Node ring -- characteristic bamboo joint */}
          {i > 0 && (
            <ellipse
              cx={cx}
              cy={yBottom}
              rx={wBottom / 2 + 1.2}
              ry={1}
              fill="none"
              stroke={c.stem}
              strokeWidth="1.2"
              opacity={0.5}
            />
          )}
          {/* Leaf clusters -- drooping from nodes, alternating sides */}
          {i > 0 && i % 1 === 0 && (
            <g opacity={Math.max(0.8 - i * 0.04, 0.4)}>
              {i % 2 === 0 ? (
                // Left side leaves
                <>
                  <path
                    d={`M${cx - wBottom / 2 - 0.5} ${yBottom - 1} Q${cx - 10 - i * 0.5} ${yBottom - 6} ${cx - 12 - i * 0.3} ${yBottom - 2}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round"
                  />
                  <path
                    d={`M${cx - wBottom / 2 - 0.5} ${yBottom - 1} Q${cx - 8 - i * 0.4} ${yBottom - 8} ${cx - 14 - i * 0.2} ${yBottom - 5}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round"
                  />
                  <path
                    d={`M${cx - wBottom / 2 - 0.5} ${yBottom - 1} Q${cx - 7} ${yBottom - 4} ${cx - 10} ${yBottom + 1}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.6" strokeLinecap="round" opacity="0.7"
                  />
                </>
              ) : (
                // Right side leaves
                <>
                  <path
                    d={`M${cx + wBottom / 2 + 0.5} ${yBottom - 1} Q${cx + 10 + i * 0.5} ${yBottom - 6} ${cx + 12 + i * 0.3} ${yBottom - 2}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round"
                  />
                  <path
                    d={`M${cx + wBottom / 2 + 0.5} ${yBottom - 1} Q${cx + 8 + i * 0.4} ${yBottom - 8} ${cx + 14 + i * 0.2} ${yBottom - 5}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round"
                  />
                  <path
                    d={`M${cx + wBottom / 2 + 0.5} ${yBottom - 1} Q${cx + 7} ${yBottom - 4} ${cx + 10} ${yBottom + 1}`}
                    fill="none" stroke={c.leaf} strokeWidth="0.6" strokeLinecap="round" opacity="0.7"
                  />
                </>
              )}
            </g>
          )}
        </g>
      )
    }

    // Crown leaves at the very top
    const topY = baseY - totalSegs * segH
    elements.push(
      <g key="crown" className="animate-unfold">
        <path d={`M18 ${topY + 2} Q12 ${topY - 6} 6 ${topY - 2}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
        <path d={`M18 ${topY + 2} Q24 ${topY - 6} 30 ${topY - 2}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
        <path d={`M18 ${topY + 2} Q14 ${topY - 10} 8 ${topY - 8}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
        <path d={`M18 ${topY + 2} Q22 ${topY - 10} 28 ${topY - 8}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
        <path d={`M18 ${topY + 2} L18 ${topY - 5}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
      </g>
    )

    return <>{elements}</>
  }

  // --- Generic stages (used by all plant types) ---
  const renderSeed = () => (
    <g className="animate-soft-fade">
      <ellipse cx="18" cy={svgH - 3} rx="3" ry="2" fill="#3d3832" opacity="0.5" />
    </g>
  )

  const renderSprout = () => (
    <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
      {type === "bamboo" ? (
        <>
          {/* Bamboo shoot -- pointed cone shape */}
          <path d={`M16 ${svgH} L18 ${svgH - 14} L20 ${svgH}`} fill={c.stem} opacity="0.6" />
          <path d={`M17 ${svgH - 2} L18 ${svgH - 14} L19 ${svgH - 2}`} fill={c.accent} opacity="0.2" />
          {/* Tiny sheath leaves */}
          <path d={`M18 ${svgH - 8} Q14 ${svgH - 10} 13 ${svgH - 8}`} fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M18 ${svgH - 11} Q22 ${svgH - 13} 23 ${svgH - 11}`} fill="none" stroke={c.leaf} strokeWidth="0.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="18" y1={svgH} x2="18" y2={svgH - 12} stroke={c.stem} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M18 ${svgH - 10} Q14 ${svgH - 13} 13 ${svgH - 12}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 10} Q22 ${svgH - 13} 23 ${svgH - 12}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </g>
  )

  const renderGrowing = () => (
    <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
      {type === "bamboo" ? (
        <>
          {/* Young bamboo -- 2 segments visible, thin */}
          <path d={`M16.5 ${svgH} L17 ${svgH - 28} L19 ${svgH - 28} L19.5 ${svgH} Z`} fill={c.stem} opacity="0.65" />
          <path d={`M17 ${svgH - 1} L17.5 ${svgH - 27} L18.5 ${svgH - 27} L19 ${svgH - 1} Z`} fill={c.accent} opacity="0.12" />
          {/* Nodes */}
          <ellipse cx="18" cy={svgH - 14} rx="3" ry="0.8" fill="none" stroke={c.stem} strokeWidth="1" opacity="0.5" />
          {/* Young leaves */}
          <path d={`M18 ${svgH - 14} Q12 ${svgH - 18} 10 ${svgH - 15}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M18 ${svgH - 14} Q24 ${svgH - 18} 26 ${svgH - 15}`} fill="none" stroke={c.leaf} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M18 ${svgH - 24} Q14 ${svgH - 27} 12 ${svgH - 25}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" />
          <path d={`M18 ${svgH - 24} Q22 ${svgH - 27} 24 ${svgH - 25}`} fill="none" stroke={c.leaf} strokeWidth="0.7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={`M18 ${svgH} Q17 ${svgH - 16} 18 ${svgH - 28}`} fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M18 ${svgH - 14} Q12 ${svgH - 18} 10 ${svgH - 16}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 14} Q24 ${svgH - 18} 26 ${svgH - 16}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 22} Q13 ${svgH - 26} 11 ${svgH - 24}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 22} Q23 ${svgH - 26} 25 ${svgH - 24}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </g>
  )

  const renderBlooming = () => (
    <g className="animate-emerge" style={{ transformOrigin: `18px ${svgH}px` }}>
      {type === "bamboo" ? (
        renderBambooCulm()
      ) : (
        <>
          <path d={`M18 ${svgH} Q17 ${svgH - 20} 18 ${svgH - 38}`} fill="none" stroke={c.stem} strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M18 ${svgH - 12} Q11 ${svgH - 16} 9 ${svgH - 14}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 12} Q25 ${svgH - 16} 27 ${svgH - 14}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 20} Q12 ${svgH - 24} 10 ${svgH - 22}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />
          <path d={`M18 ${svgH - 20} Q24 ${svgH - 24} 26 ${svgH - 22}`} fill="none" stroke={c.leaf} strokeWidth="1" strokeLinecap="round" />

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
        </>
      )}
    </g>
  )

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
        {currentStage === "seed" && renderSeed()}
        {currentStage === "sprout" && renderSprout()}
        {currentStage === "growing" && renderGrowing()}
        {currentStage === "blooming" && renderBlooming()}
      </svg>
    </div>
  )
})
