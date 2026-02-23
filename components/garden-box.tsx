"use client"

import { useState, useCallback, useRef } from "react"
import { SeedBag } from "./seed-bag"
import { Plant, type PlantStage, type PlantType } from "./plant"

interface PlantData {
  id: number
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
}

const PLANT_TYPES: PlantType[] = ["bamboo", "bonsai", "moss", "orchid"]

export function GardenBox() {
  const [plants, setPlants] = useState<PlantData[]>([])
  const [nextId, setNextId] = useState(0)
  const [seedsDropped, setSeedsDropped] = useState(0)
  const gardenRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  const handleShake = useCallback((bagX: number, bagY: number) => {
    if (!sceneRef.current || !gardenRef.current) return

    const gardenRect = gardenRef.current.getBoundingClientRect()
    const sceneRect = sceneRef.current.getBoundingClientRect()

    // Convert bag position to a percentage within the garden scene
    // bagX/bagY are relative to gardenRef
    const relX = ((bagX) / gardenRect.width) * 100
    const clampedX = Math.max(8, Math.min(92, relX))

    const numSeeds = Math.floor(Math.random() * 2) + 1
    const newPlants: PlantData[] = []

    for (let i = 0; i < numSeeds; i++) {
      const spreadX = clampedX + (Math.random() - 0.5) * 10
      const type = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)]
      const stages: PlantStage[] = ["sprout", "growing", "blooming"]
      const stage = stages[Math.floor(Math.random() * stages.length)]

      newPlants.push({
        id: nextId + i,
        x: Math.max(5, Math.min(95, spreadX)),
        stage,
        type,
        delay: 300 + i * 400,
      })
    }

    setPlants((prev) => [...prev, ...newPlants])
    setNextId((prev) => prev + numSeeds)
    setSeedsDropped((prev) => prev + numSeeds)
  }, [nextId])

  const handleClear = useCallback(() => {
    setPlants([])
    setSeedsDropped(0)
  }, [])

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-md mx-auto">
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
          style={{ width: 24, height: 1, backgroundColor: "#3d3832", opacity: 0.3 }}
        />
      </div>

      {/* Full interactive area - bag lives here and can be dragged everywhere */}
      <div
        ref={gardenRef}
        className="relative w-full"
        style={{ minWidth: 300, minHeight: 380 }}
      >
        {/* Seed bag (draggable over entire area) */}
        <SeedBag onShake={handleShake} containerRef={gardenRef} />

        {/* Garden scene (positioned at bottom of area) */}
        <div
          ref={sceneRef}
          className="absolute bottom-0 left-0 right-0"
        >
          <div
            className="relative overflow-hidden"
            style={{
              border: "1px solid #d6cfc4",
              borderRadius: 2,
              backgroundColor: "#f5f2ed",
            }}
          >
            {/* Sky / empty space */}
            <div className="relative" style={{ height: 200 }}>
              {/* Enso circle */}
              <svg
                className="absolute"
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
              <div className="absolute left-0 right-0" style={{ bottom: 0, height: 160 }}>
                {plants.map((plant) => (
                  <Plant
                    key={plant.id}
                    x={plant.x}
                    stage={plant.stage}
                    type={plant.type}
                    delay={plant.delay}
                  />
                ))}
              </div>
            </div>

            {/* Ground */}
            <div className="relative">
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
              <div style={{ height: 8, backgroundColor: "#d6cfc4", borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-6">
        <span className="text-xs text-muted-foreground font-sans tracking-wide">
          {seedsDropped === 0 ? "\u00A0" : `${seedsDropped}`}
        </span>
        {plants.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground font-sans tracking-widest uppercase hover:text-foreground transition-colors"
          >
            clear
          </button>
        )}
      </div>
    </div>
  )
}
