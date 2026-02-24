"use client"

import { useState, useCallback, useRef } from "react"
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

// Grass blade positions (percentage along ground)
const GRASS_BLADES = [
  { x: 5, h: 6, anim: 1 }, { x: 12, h: 5, anim: 2 }, { x: 18, h: 7, anim: 3 },
  { x: 25, h: 5, anim: 1 }, { x: 32, h: 6, anim: 2 }, { x: 40, h: 4, anim: 3 },
  { x: 48, h: 7, anim: 1 }, { x: 55, h: 5, anim: 2 }, { x: 62, h: 6, anim: 3 },
  { x: 70, h: 4, anim: 1 }, { x: 78, h: 6, anim: 2 }, { x: 85, h: 5, anim: 3 },
  { x: 92, h: 7, anim: 1 }, { x: 97, h: 4, anim: 2 },
]

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
  const [isPouring, setIsPouring] = useState(false)
  const [canPosX, setCanPosX] = useState(0)
  const [pebbleShift, setPebbleShift] = useState(0)
  const gardenRef = useRef<HTMLDivElement>(null)

  // Stable refs
  const selectedSeedRef = useRef(selectedSeed)
  const inventoryRef = useRef(inventory)
  const nextIdRef = useRef(nextId)
  selectedSeedRef.current = selectedSeed
  inventoryRef.current = inventory
  nextIdRef.current = nextId

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

      // Pebble parallax
      if (gardenRef.current) {
        const r = gardenRef.current.getBoundingClientRect()
        const ratio = ((bagCenterX - r.left) / r.width - 0.5) * 2
        setPebbleShift(ratio * 3)
      }
    },
    [],
  )

  const handleBuySeed = useCallback(
    (type: PlantType, price: number) => {
      setCoins((prev) => {
        if (prev < price) return prev
        setInventory((inv) => ({ ...inv, [type]: inv[type] + 5 }))
        setSelectedSeed(type)
        return prev - price
      })
    },
    [],
  )

  const handleWater = useCallback(
    (canCenterX: number) => {
      if (!gardenRef.current) return
      const rect = gardenRef.current.getBoundingClientRect()
      const relX = ((canCenterX - rect.left) / rect.width) * 100

      setPlants((prev) => {
        if (prev.length === 0) return prev
        let closestIdx = -1
        let closestDist = 20
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
    },
    [],
  )

  const handleClear = useCallback(() => {
    setIsWilting(true)
    setTimeout(() => { setPlants([]); setSeedsDropped(0); setIsWilting(false) }, 700)
  }, [])

  // Watering can position -> pebble parallax + plant glow proximity
  const handleCanPosition = useCallback((x: number) => {
    setCanPosX(x)
    if (gardenRef.current && x > 0) {
      const r = gardenRef.current.getBoundingClientRect()
      const ratio = ((x - r.left) / r.width - 0.5) * 2
      setPebbleShift(ratio * 3)
    } else {
      setPebbleShift(0)
    }
  }, [])

  // Determine which plants glow (near watering can during pour)
  const getPlantGlow = useCallback(
    (plantX: number) => {
      if (!isPouring || canPosX === 0 || !gardenRef.current) return false
      const r = gardenRef.current.getBoundingClientRect()
      const canRelX = ((canPosX - r.left) / r.width) * 100
      return Math.abs(plantX - canRelX) < 15
    },
    [isPouring, canPosX],
  )

  return (
    <div className="flex flex-col items-center gap-6 md:gap-10 w-full max-w-md mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1
          className="text-xl font-light tracking-[0.2em] text-foreground font-serif"
          style={{ letterSpacing: "0.2em" }}
        >
          {"plant-garden"}
        </h1>
        <div className="mx-auto mt-3" style={{ width: 24, height: 1, backgroundColor: "#3d3832", opacity: 0.3 }} />
      </div>

      {/* Garden canvas */}
      <div
        ref={gardenRef}
        className="relative w-full overflow-hidden"
        style={{
          border: "1px solid #d6cfc4", borderRadius: 2,
          backgroundColor: "#f5f2ed", touchAction: "none", userSelect: "none",
        }}
      >
        <div className="relative" style={{ height: "clamp(280px, 60vw, 400px)" }}>
          {/* Shop */}
          <SeedShop
            coins={coins} coinPop={coinPop} selectedSeed={selectedSeed}
            onSelectSeed={setSelectedSeed} onBuySeed={handleBuySeed} inventory={inventory}
          />

          {/* Enso circle */}
          <svg className="absolute pointer-events-none animate-breathe" style={{ top: 16, right: 20 }} width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#3d3832" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 40" />
          </svg>

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
                glowing={getPlantGlow(plant.x)}
              />
            ))}
          </div>

          {/* Pond */}
          <div className="absolute pointer-events-none" style={{ bottom: 24, right: 16 }}>
            <svg width="64" height="36" viewBox="0 0 64 36" fill="none">
              <ellipse cx="32" cy="20" rx="30" ry="14" fill="#c8d8e0" opacity={pondGlow ? 0.5 : 0.35} style={{ transition: "opacity 0.5s ease" }} />
              <ellipse cx="32" cy="20" rx="30" ry="14" fill="none" stroke="#9ab0b8" strokeWidth={pondGlow ? 1.2 : 0.8} opacity={pondGlow ? 0.6 : 0.4} style={{ transition: "all 0.5s ease" }} />
              <ellipse cx="32" cy="21" rx="22" ry="9" fill="#b0c8d4" opacity={pondGlow ? 0.4 : 0.25} style={{ transition: "opacity 0.5s ease" }} />
              {/* Ripples -- faster and larger when can is near */}
              <ellipse cx="28" cy="19" rx="8" ry="3" fill="none" stroke="#8aacbc" strokeWidth="0.5" opacity="0.3">
                <animate attributeName="rx" values={pondGlow ? "8;16;8" : "8;12;8"} dur={pondGlow ? "2s" : "4s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={pondGlow ? "0.5;0.15;0.5" : "0.3;0.1;0.3"} dur={pondGlow ? "2s" : "4s"} repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="36" cy="22" rx="6" ry="2.5" fill="none" stroke="#8aacbc" strokeWidth="0.4" opacity="0.25">
                <animate attributeName="rx" values={pondGlow ? "6;14;6" : "6;10;6"} dur={pondGlow ? "2.5s" : "5s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={pondGlow ? "0.45;0.1;0.45" : "0.25;0.08;0.25"} dur={pondGlow ? "2.5s" : "5s"} repeatCount="indefinite" />
              </ellipse>
              {/* Extra ripple only when near */}
              {pondGlow && (
                <ellipse cx="32" cy="20" rx="4" ry="2" fill="none" stroke="#8aacbc" strokeWidth="0.6" opacity="0.4">
                  <animate attributeName="rx" values="4;20;4" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="ry" values="2;8;2" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                </ellipse>
              )}
              <circle cx="8" cy="22" r="2" fill="#d6cfc4" opacity="0.5" />
              <circle cx="56" cy="18" r="1.5" fill="#d6cfc4" opacity="0.4" />
              <circle cx="12" cy="28" r="1.2" fill="#c4bdb2" opacity="0.4" />
            </svg>
            <p
              className="text-center font-sans tracking-widest uppercase pointer-events-none"
              style={{ fontSize: 8, color: pondGlow ? "#7a9ea8" : "#9ab0b8", opacity: pondGlow ? 0.7 : 0.5, marginTop: 2, transition: "all 0.5s ease" }}
            >
              pond
            </p>
          </div>

          {/* Seed bag */}
          <SeedBag onShake={handleShake} containerRef={gardenRef} />

          {/* Watering can */}
          <WateringCan
            onWater={handleWater}
            containerRef={gardenRef}
            onNearPondChange={setPondGlow}
            onPouringChange={setIsPouring}
            onPositionChange={handleCanPosition}
          />
        </div>

        {/* Ground with grass blades and pebble parallax */}
        <div className="relative pointer-events-none">
          {/* Grass blades on the ground line */}
          <div className="absolute left-0 right-0" style={{ bottom: "100%", height: 12 }}>
            {GRASS_BLADES.map((g, i) => (
              <svg
                key={i}
                className={`absolute animate-grass-${g.anim}`}
                style={{ left: `${g.x}%`, bottom: 0, width: 4, height: g.h + 4, overflow: "visible" }}
                viewBox={`0 0 4 ${g.h + 4}`}
              >
                <path
                  d={`M2 ${g.h + 4} Q${1 + (i % 2)} ${g.h * 0.3} ${i % 2 === 0 ? 1 : 3} 0`}
                  fill="none"
                  stroke="#8a9e7a"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
            ))}
          </div>

          <div style={{ height: 1, backgroundColor: "#c4bdb2" }} />

          {/* Pebbles with parallax */}
          <div
            className="flex items-center justify-around px-8"
            style={{
              height: 28,
              backgroundColor: "#ece7df",
              transform: `translateX(${pebbleShift}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  height: i % 2 === 0 ? 3 : 2,
                  width: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
                  backgroundColor: i % 2 === 0 ? "#c4bdb2" : "#b8b0a4",
                  opacity: 0.45,
                  transform: `translateX(${pebbleShift * (i % 2 === 0 ? 0.5 : -0.3)}px)`,
                  transition: "transform 0.4s ease-out",
                }}
              />
            ))}
          </div>

          <div style={{ height: 8, backgroundColor: "#d6cfc4", borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
        </div>
      </div>

      {/* Counter & controls */}
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
