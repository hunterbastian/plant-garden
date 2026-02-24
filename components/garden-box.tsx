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

export function GardenBox() {
  const [plants, setPlants] = useState<PlantData[]>([])
  const [nextId, setNextId] = useState(0)
  const [seedsDropped, setSeedsDropped] = useState(0)
  const [coins, setCoins] = useState(5)
  const [selectedSeed, setSelectedSeed] = useState<PlantType>("bamboo")
  const [inventory, setInventory] = useState<Record<PlantType, number>>({
    bamboo: 99,
    bonsai: 0,
    moss: 0,
    orchid: 0,
  })
  const gardenRef = useRef<HTMLDivElement>(null)

  // Stable refs for callback values to avoid re-creating handlers
  const selectedSeedRef = useRef(selectedSeed)
  const inventoryRef = useRef(inventory)
  const nextIdRef = useRef(nextId)
  const seedsDroppedRef = useRef(seedsDropped)
  selectedSeedRef.current = selectedSeed
  inventoryRef.current = inventory
  nextIdRef.current = nextId
  seedsDroppedRef.current = seedsDropped

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
          stage,
          type: seed,
          delay: 300 + i * 400,
          watered: false,
        })
      }

      setPlants((prev) => [...prev, ...newPlants])
      setNextId((prev) => prev + numSeeds)
      setSeedsDropped((prev) => {
        const next = prev + numSeeds
        if (next % 3 === 0) setCoins((c) => c + 1)
        return next
      })

      if (seed !== "bamboo") {
        setInventory((prev) => ({
          ...prev,
          [seed]: Math.max(0, prev[seed] - numSeeds),
        }))
      }
    },
    [], // stable -- reads from refs
  )

  const handleBuySeed = useCallback(
    (type: PlantType, price: number) => {
      if (coins < price) return
      setCoins((prev) => prev - price)
      setInventory((prev) => ({
        ...prev,
        [type]: prev[type] + 5,
      }))
      setSelectedSeed(type)
    },
    [coins],
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
          if (dist < closestDist) {
            closestDist = dist
            closestIdx = i
          }
        })

        if (closestIdx >= 0) {
          setCoins((c) => c + 1)
          return prev.map((p, i) =>
            i === closestIdx ? { ...p, watered: true } : p,
          )
        }
        return prev
      })
    },
    [], // stable -- uses setPlants functional update
  )

  const handleClear = useCallback(() => {
    setPlants([])
    setSeedsDropped(0)
  }, [])

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
        <div
          className="mx-auto mt-3"
          style={{
            width: 24,
            height: 1,
            backgroundColor: "#3d3832",
            opacity: 0.3,
          }}
        />
      </div>

      {/* Unified garden canvas */}
      <div
        ref={gardenRef}
        className="relative w-full overflow-hidden"
        style={{
          border: "1px solid #d6cfc4",
          borderRadius: 2,
          backgroundColor: "#f5f2ed",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {/* Canvas area -- aspect-ratio keeps it proportional on all screens */}
        <div className="relative" style={{ height: "clamp(280px, 60vw, 400px)" }}>
          {/* Shop */}
          <SeedShop
            coins={coins}
            selectedSeed={selectedSeed}
            onSelectSeed={setSelectedSeed}
            onBuySeed={handleBuySeed}
            inventory={inventory}
          />

          {/* Enso circle */}
          <svg
            className="absolute pointer-events-none"
            style={{ top: 16, right: 20, opacity: 0.06 }}
            width="60"
            height="60"
            viewBox="0 0 60 60"
          >
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              stroke="#3d3832"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="120 40"
            />
          </svg>

          {/* Plants area */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: 0, height: 180 }}
          >
            {plants.map((plant) => (
              <Plant
                key={plant.id}
                x={plant.x}
                stage={plant.stage}
                type={plant.type}
                delay={plant.delay}
                watered={plant.watered}
              />
            ))}
          </div>

          {/* Pond - bottom right */}
          <div
            className="absolute pointer-events-none"
            style={{ bottom: 24, right: 16 }}
          >
            <svg width="64" height="36" viewBox="0 0 64 36" fill="none">
              {/* Pond body */}
              <ellipse cx="32" cy="20" rx="30" ry="14" fill="#c8d8e0" opacity="0.35" />
              <ellipse cx="32" cy="20" rx="30" ry="14" fill="none" stroke="#9ab0b8" strokeWidth="0.8" opacity="0.4" />
              {/* Inner water */}
              <ellipse cx="32" cy="21" rx="22" ry="9" fill="#b0c8d4" opacity="0.25" />
              {/* Ripple lines */}
              <ellipse cx="28" cy="19" rx="8" ry="3" fill="none" stroke="#8aacbc" strokeWidth="0.5" opacity="0.3">
                <animate attributeName="rx" values="8;12;8" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="36" cy="22" rx="6" ry="2.5" fill="none" stroke="#8aacbc" strokeWidth="0.4" opacity="0.25">
                <animate attributeName="rx" values="6;10;6" dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0.08;0.25" dur="5s" repeatCount="indefinite" />
              </ellipse>
              {/* Small stones around edge */}
              <circle cx="8" cy="22" r="2" fill="#d6cfc4" opacity="0.5" />
              <circle cx="56" cy="18" r="1.5" fill="#d6cfc4" opacity="0.4" />
              <circle cx="12" cy="28" r="1.2" fill="#c4bdb2" opacity="0.4" />
            </svg>
            <p
              className="text-center font-sans tracking-widest uppercase pointer-events-none"
              style={{ fontSize: 8, color: "#9ab0b8", opacity: 0.5, marginTop: 2 }}
            >
              pond
            </p>
          </div>

          {/* Seed bag */}
          <SeedBag onShake={handleShake} containerRef={gardenRef} />

          {/* Watering can */}
          <WateringCan onWater={handleWater} containerRef={gardenRef} />
        </div>

        {/* Ground */}
        <div className="relative pointer-events-none">
          <div style={{ height: 1, backgroundColor: "#c4bdb2" }} />
          <div
            className="flex items-center justify-around px-8"
            style={{ height: 28, backgroundColor: "#ece7df" }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  height: i % 2 === 0 ? 3 : 2,
                  width: i % 2 === 0 ? 3 : 2,
                  backgroundColor: "#c4bdb2",
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
          <div
            style={{
              height: 8,
              backgroundColor: "#d6cfc4",
              borderBottomLeftRadius: 1,
              borderBottomRightRadius: 1,
            }}
          />
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
