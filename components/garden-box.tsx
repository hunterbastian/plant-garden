"use client"

import { useState, useCallback, useRef, memo } from "react"
import { SeedBag } from "./seed-bag"
import { Plant, type PlantStage, type PlantType } from "./plant"
import { SeedShop } from "./seed-shop"
import { WateringCan } from "./watering-can"

interface PlantData {
  id: number
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
  watered: boolean
}

// Grass blade config
const GRASS_BLADES = [
  { x: 5, h: 6, a: 1 }, { x: 12, h: 5, a: 2 }, { x: 18, h: 7, a: 3 },
  { x: 25, h: 5, a: 1 }, { x: 32, h: 6, a: 2 }, { x: 40, h: 4, a: 3 },
  { x: 48, h: 7, a: 1 }, { x: 55, h: 5, a: 2 }, { x: 62, h: 6, a: 3 },
  { x: 70, h: 4, a: 1 }, { x: 78, h: 6, a: 2 }, { x: 85, h: 5, a: 3 },
  { x: 92, h: 7, a: 1 }, { x: 97, h: 4, a: 2 },
]

// Static grass -- rendered once, never re-renders
const GrassLayer = memo(function GrassLayer() {
  return (
    <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "100%", height: 12 }}>
      {GRASS_BLADES.map((g, i) => (
        <svg
          key={i}
          className={`absolute animate-grass-${g.a}`}
          style={{ left: `${g.x}%`, bottom: 0, width: 4, height: g.h + 4, overflow: "visible" }}
          viewBox={`0 0 4 ${g.h + 4}`}
        >
          <path
            d={`M2 ${g.h + 4} Q${1 + (i % 2)} ${g.h * 0.3} ${i % 2 === 0 ? 1 : 3} 0`}
            fill="none" stroke="#8a9e7a" strokeWidth="0.8" strokeLinecap="round" opacity="0.35"
          />
        </svg>
      ))}
    </div>
  )
})

// Static enso -- rendered once
const Enso = memo(function Enso() {
  return (
    <svg className="absolute pointer-events-none animate-breathe" style={{ top: 16, right: 20 }} width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="26" fill="none" stroke="#3d3832" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 40" />
    </svg>
  )
})

export function GardenBox() {
  const [plants, setPlants] = useState<PlantData[]>([])
  const [nextId, setNextId] = useState(0)
  const [seedsDropped, setSeedsDropped] = useState(0)
  const [coins, setCoins] = useState(5)
  const [selectedSeed, setSelectedSeed] = useState<PlantType>("bamboo")
  const [inventory, setInventory] = useState<Record<PlantType, number>>({
    bamboo: 99, bonsai: 0, moss: 0, orchid: 0,
  })
  const [isWilting, setIsWilting] = useState(false)
  const [coinPop, setCoinPop] = useState(false)
  const [pondGlow, setPondGlow] = useState(false)
  const [pondSplash, setPondSplash] = useState(false)

  // Pouring + canPos tracked via refs to avoid re-renders during drag
  const isPouringRef = useRef(false)
  const canPosXRef = useRef(0)
  // Glowing plant IDs tracked via ref, applied on next plant state change
  const glowingPlantsRef = useRef<Set<number>>(new Set())
  const [glowingPlants, setGlowingPlants] = useState<Set<number>>(new Set())

  const gardenRef = useRef<HTMLDivElement>(null)
  const pebbleRowRef = useRef<HTMLDivElement>(null)
  const pebbleRefs = useRef<(HTMLDivElement | null)[]>([])

  // Stable refs for callbacks
  const selectedSeedRef = useRef(selectedSeed)
  const inventoryRef = useRef(inventory)
  const nextIdRef = useRef(nextId)
  const plantsRef = useRef(plants)
  selectedSeedRef.current = selectedSeed
  inventoryRef.current = inventory
  nextIdRef.current = nextId
  plantsRef.current = plants

  // Update pebble parallax via DOM -- no state
  const updatePebbleParallax = useCallback((ratio: number) => {
    const shift = ratio * 3
    if (pebbleRowRef.current) {
      pebbleRowRef.current.style.transform = `translateX(${shift}px)`
    }
    pebbleRefs.current.forEach((el, i) => {
      if (el) {
        const factor = i % 2 === 0 ? 0.5 : -0.3
        el.style.transform = `translateX(${shift * factor}px)`
      }
    })
  }, [])

  // Update plant glow based on can position -- batched via rAF
  const glowRafRef = useRef<number>(0)
  const updateGlow = useCallback(() => {
    cancelAnimationFrame(glowRafRef.current)
    glowRafRef.current = requestAnimationFrame(() => {
      if (!isPouringRef.current || canPosXRef.current === 0 || !gardenRef.current) {
        if (glowingPlantsRef.current.size > 0) {
          glowingPlantsRef.current = new Set()
          setGlowingPlants(new Set())
        }
        return
      }
      const r = gardenRef.current.getBoundingClientRect()
      const canRelX = ((canPosXRef.current - r.left) / r.width) * 100
      const newGlow = new Set<number>()
      plantsRef.current.forEach((p) => {
        if (Math.abs(p.x - canRelX) < 15) newGlow.add(p.id)
      })
      // Only setState if changed
      const prev = glowingPlantsRef.current
      if (newGlow.size !== prev.size || [...newGlow].some((id) => !prev.has(id))) {
        glowingPlantsRef.current = newGlow
        setGlowingPlants(newGlow)
      }
    })
  }, [])

  const handleShake = useCallback(
    (bagCenterX: number) => {
      if (!gardenRef.current) return
      const seed = selectedSeedRef.current
      const inv = inventoryRef.current
      if (inv[seed] <= 0 && seed !== "bamboo") return

      const rect = gardenRef.current.getBoundingClientRect()
      const relX = ((bagCenterX - rect.left) / rect.width) * 100
      const clampedX = Math.max(8, Math.min(92, relX))
      const numSeeds = Math.floor(Math.random() * 2) + 1
      const newPlants: PlantData[] = []
      const baseId = nextIdRef.current

      for (let i = 0; i < numSeeds; i++) {
        const spreadX = clampedX + (Math.random() - 0.5) * 10
        const stages: PlantStage[] = ["sprout", "growing", "blooming"]
        const stage = stages[Math.floor(Math.random() * stages.length)]
        newPlants.push({
          id: baseId + i,
          x: Math.max(5, Math.min(95, spreadX)),
          stage, type: seed, delay: 300 + i * 400, watered: false,
        })
      }

      setPlants((prev) => [...prev, ...newPlants])
      setNextId((prev) => prev + numSeeds)
      setSeedsDropped((prev) => {
        const next = prev + numSeeds
        if (next % 3 === 0) {
          setCoins((c) => c + 1)
          setCoinPop(true)
          setTimeout(() => setCoinPop(false), 350)
        }
        return next
      })
      if (seed !== "bamboo") {
        setInventory((prev) => ({ ...prev, [seed]: Math.max(0, prev[seed] - numSeeds) }))
      }

      // Pebble parallax via DOM
      const r = gardenRef.current.getBoundingClientRect()
      const ratio = ((bagCenterX - r.left) / r.width - 0.5) * 2
      updatePebbleParallax(ratio)
    },
    [updatePebbleParallax],
  )

  const handleBuySeed = useCallback((type: PlantType, price: number) => {
    setCoins((prev) => {
      if (prev < price) return prev
      setInventory((inv) => ({ ...inv, [type]: inv[type] + 5 }))
      setSelectedSeed(type)
      return prev - price
    })
  }, [])

  const handleWater = useCallback((canCenterX: number) => {
    if (!gardenRef.current) return
    const rect = gardenRef.current.getBoundingClientRect()
    const relX = ((canCenterX - rect.left) / rect.width) * 100

    setPlants((prev) => {
      if (prev.length === 0) return prev
      let closestIdx = -1, closestDist = 20
      prev.forEach((plant, i) => {
        if (plant.watered) return
        const dist = Math.abs(plant.x - relX)
        if (dist < closestDist) { closestDist = dist; closestIdx = i }
      })
      if (closestIdx >= 0) {
        setCoins((c) => c + 1)
        setCoinPop(true)
        setTimeout(() => setCoinPop(false), 350)
        return prev.map((p, i) => i === closestIdx ? { ...p, watered: true } : p)
      }
      return prev
    })
  }, [])

  const handleClear = useCallback(() => {
    setIsWilting(true)
    setTimeout(() => { setPlants([]); setSeedsDropped(0); setIsWilting(false) }, 700)
  }, [])

  // Can position updates -- ref-based, no re-render
  const handleCanPosition = useCallback((x: number) => {
    canPosXRef.current = x
    if (gardenRef.current && x > 0) {
      const r = gardenRef.current.getBoundingClientRect()
      const ratio = ((x - r.left) / r.width - 0.5) * 2
      updatePebbleParallax(ratio)
    } else {
      updatePebbleParallax(0)
    }
    updateGlow()
  }, [updatePebbleParallax, updateGlow])

  const handlePouringChange = useCallback((pouring: boolean) => {
    isPouringRef.current = pouring
    updateGlow()
  }, [updateGlow])

  return (
    <div className="flex flex-col items-center gap-6 md:gap-10 w-full max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-xl font-light tracking-[0.2em] text-foreground font-serif" style={{ letterSpacing: "0.2em" }}>
          {"plant-garden"}
        </h1>
        <div className="mx-auto mt-3" style={{ width: 24, height: 1, backgroundColor: "#3d3832", opacity: 0.3 }} />
      </div>

      <div
        ref={gardenRef}
        className="relative w-full overflow-hidden"
        style={{ border: "1px solid #d6cfc4", borderRadius: 2, backgroundColor: "#f5f2ed", touchAction: "none", userSelect: "none" }}
      >
        <div className="relative" style={{ height: "clamp(280px, 60vw, 400px)" }}>
          <SeedShop
            coins={coins} coinPop={coinPop} selectedSeed={selectedSeed}
            onSelectSeed={setSelectedSeed} onBuySeed={handleBuySeed} inventory={inventory}
          />
          <Enso />

          {/* Plants area */}
          <div
            className={`absolute left-0 right-0 pointer-events-none ${isWilting ? "animate-wilt" : ""}`}
            style={{ bottom: 0, height: 180 }}
          >
            {plants.map((plant) => (
              <Plant
                key={plant.id}
                x={plant.x} stage={plant.stage} type={plant.type}
                delay={plant.delay} watered={plant.watered}
                glowing={glowingPlants.has(plant.id)}
              />
            ))}
          </div>

          {/* Pond */}
          <div
            className="absolute"
            style={{ bottom: 24, right: 16, cursor: "pointer", pointerEvents: "auto" }}
            onClick={() => {
              if (pondSplash) return
              setPondSplash(true)
              setTimeout(() => setPondSplash(false), 700)
            }}
          >
            <svg width="64" height="44" viewBox="0 0 64 44" fill="none" className="overflow-visible">
              <ellipse cx="32" cy="24" rx="30" ry="14" fill="#c8d8e0" opacity={pondGlow ? 0.5 : 0.35} style={{ transition: "opacity 0.5s ease" }} />
              <ellipse cx="32" cy="24" rx="30" ry="14" fill="none" stroke="#9ab0b8" strokeWidth={pondGlow ? 1.2 : 0.8} opacity={pondGlow ? 0.6 : 0.4} style={{ transition: "all 0.5s ease" }} />
              <ellipse cx="32" cy="25" rx="22" ry="9" fill="#b0c8d4" opacity={pondGlow ? 0.4 : 0.25} style={{ transition: "opacity 0.5s ease" }} />
              <ellipse cx="28" cy="23" rx="8" ry="3" fill="none" stroke="#8aacbc" strokeWidth="0.5" opacity="0.3">
                <animate attributeName="rx" values={pondGlow ? "8;16;8" : "8;12;8"} dur={pondGlow ? "2s" : "4s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={pondGlow ? "0.5;0.15;0.5" : "0.3;0.1;0.3"} dur={pondGlow ? "2s" : "4s"} repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="36" cy="26" rx="6" ry="2.5" fill="none" stroke="#8aacbc" strokeWidth="0.4" opacity="0.25">
                <animate attributeName="rx" values={pondGlow ? "6;14;6" : "6;10;6"} dur={pondGlow ? "2.5s" : "5s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={pondGlow ? "0.45;0.1;0.45" : "0.25;0.08;0.25"} dur={pondGlow ? "2.5s" : "5s"} repeatCount="indefinite" />
              </ellipse>
              {pondGlow && (
                <ellipse cx="32" cy="24" rx="4" ry="2" fill="none" stroke="#8aacbc" strokeWidth="0.6" opacity="0.4">
                  <animate attributeName="rx" values="4;20;4" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="ry" values="2;8;2" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                </ellipse>
              )}
              {pondSplash && (
                <g>
                  <circle cx="32" cy="24" fill="none" stroke="#8aacbc" strokeWidth="0.8">
                    <animate attributeName="r" from="2" to="18" dur="0.6s" fill="freeze" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="0.6s" fill="freeze" />
                  </circle>
                  <circle cx="32" cy="24" fill="none" stroke="#8aacbc" strokeWidth="0.5">
                    <animate attributeName="r" from="1" to="12" dur="0.5s" begin="0.1s" fill="freeze" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="0.5s" begin="0.1s" fill="freeze" />
                  </circle>
                  <circle cx="30" cy="22" r="1.2" fill="#8aacbc" opacity="0.7">
                    <animate attributeName="cy" from="22" to="10" dur="0.4s" fill="freeze" />
                    <animate attributeName="cx" from="30" to="26" dur="0.4s" fill="freeze" />
                    <animate attributeName="opacity" from="0.7" to="0" dur="0.4s" fill="freeze" />
                  </circle>
                  <circle cx="34" cy="22" r="1" fill="#8aacbc" opacity="0.6">
                    <animate attributeName="cy" from="22" to="8" dur="0.45s" fill="freeze" />
                    <animate attributeName="cx" from="34" to="37" dur="0.45s" fill="freeze" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="0.45s" fill="freeze" />
                  </circle>
                  <circle cx="32" cy="22" r="0.8" fill="#8aacbc" opacity="0.5">
                    <animate attributeName="cy" from="22" to="12" dur="0.38s" begin="0.05s" fill="freeze" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="0.38s" begin="0.05s" fill="freeze" />
                  </circle>
                  <circle cx="28" cy="24" r="0.9" fill="#8aacbc" opacity="0.5">
                    <animate attributeName="cy" from="24" to="14" dur="0.42s" begin="0.08s" fill="freeze" />
                    <animate attributeName="cx" from="28" to="22" dur="0.42s" begin="0.08s" fill="freeze" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="0.42s" begin="0.08s" fill="freeze" />
                  </circle>
                  <circle cx="36" cy="24" r="1.1" fill="#8aacbc" opacity="0.6">
                    <animate attributeName="cy" from="24" to="11" dur="0.4s" begin="0.03s" fill="freeze" />
                    <animate attributeName="cx" from="36" to="42" dur="0.4s" begin="0.03s" fill="freeze" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="0.4s" begin="0.03s" fill="freeze" />
                  </circle>
                </g>
              )}
              <circle cx="8" cy="26" r="2" fill="#d6cfc4" opacity="0.5" />
              <circle cx="56" cy="22" r="1.5" fill="#d6cfc4" opacity="0.4" />
              <circle cx="12" cy="32" r="1.2" fill="#c4bdb2" opacity="0.4" />
            </svg>
            <p className="text-center font-sans tracking-widest uppercase pointer-events-none"
              style={{ fontSize: 8, color: pondGlow ? "#7a9ea8" : "#9ab0b8", opacity: pondGlow ? 0.7 : 0.5, marginTop: 2, transition: "all 0.5s ease" }}>
              pond
            </p>
          </div>

          <SeedBag onShake={handleShake} containerRef={gardenRef} />
          <WateringCan
            onWater={handleWater} containerRef={gardenRef}
            onNearPondChange={setPondGlow} onPouringChange={handlePouringChange}
            onPositionChange={handleCanPosition}
          />
        </div>

        {/* Ground */}
        <div className="relative pointer-events-none">
          <GrassLayer />
          <div style={{ height: 1, backgroundColor: "#c4bdb2" }} />
          <div
            ref={pebbleRowRef}
            className="flex items-center justify-around px-8"
            style={{ height: 28, backgroundColor: "#ece7df", transition: "transform 0.3s ease-out" }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                ref={(el) => { pebbleRefs.current[i] = el }}
                className="rounded-full"
                style={{
                  height: i % 2 === 0 ? 3 : 2,
                  width: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
                  backgroundColor: i % 2 === 0 ? "#c4bdb2" : "#b8b0a4",
                  opacity: 0.45,
                  transition: "transform 0.4s ease-out",
                }}
              />
            ))}
          </div>
          <div style={{ height: 8, backgroundColor: "#d6cfc4", borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-xs text-muted-foreground font-sans tracking-wide">
          {seedsDropped === 0 ? "\u00A0" : `${seedsDropped}`}
        </span>
        {plants.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground font-sans tracking-widest uppercase hover:text-foreground transition-colors"
            style={{ minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            clear
          </button>
        )}
      </div>
    </div>
  )
}
