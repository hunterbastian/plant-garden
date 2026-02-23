"use client"

import { useState, useCallback } from "react"
import { SeedBag } from "./seed-bag"
import { Plant, type PlantStage, type PlantType } from "./plant"

interface PlantData {
  id: number
  x: number
  stage: PlantStage
  type: PlantType
  delay: number
}

const PLANT_TYPES: PlantType[] = ["flower", "tulip", "succulent", "fern"]

export function GardenBox() {
  const [plants, setPlants] = useState<PlantData[]>([])
  const [nextId, setNextId] = useState(0)
  const [seedsDropped, setSeedsDropped] = useState(0)

  const handleShake = useCallback(() => {
    const numSeeds = Math.floor(Math.random() * 2) + 1
    const newPlants: PlantData[] = []

    for (let i = 0; i < numSeeds; i++) {
      const x = 8 + Math.random() * 84
      const type = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)]
      const stages: PlantStage[] = ["sprout", "growing", "blooming"]
      const stage = stages[Math.floor(Math.random() * stages.length)]

      newPlants.push({
        id: nextId + i,
        x,
        stage,
        type,
        delay: 200 + i * 300,
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
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          Plant Garden
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Shake the seed bag to grow your garden
        </p>
      </div>

      {/* Seed bag area */}
      <SeedBag onShake={handleShake} />

      {/* Garden box */}
      <div className="relative w-full" style={{ minWidth: 320 }}>
        {/* The box frame */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            border: "3px solid #8b6342",
            backgroundColor: "#87CEEB",
          }}
        >
          {/* Sky area */}
          <div className="relative" style={{ height: 200 }}>
            {/* Sun */}
            <div
              className="absolute rounded-full"
              style={{
                top: 16,
                right: 24,
                height: 40,
                width: 40,
                backgroundColor: "#f5c542",
                boxShadow: "0 0 20px rgba(245,197,66,0.5)",
              }}
            />

            {/* Clouds */}
            <div className="absolute flex" style={{ top: 24, left: 32 }}>
              <div className="rounded-full" style={{ height: 16, width: 32, backgroundColor: "white", opacity: 0.8 }} />
              <div className="rounded-full" style={{ height: 24, width: 40, backgroundColor: "white", opacity: 0.8, marginLeft: -12, marginTop: -4 }} />
              <div className="rounded-full" style={{ height: 16, width: 32, backgroundColor: "white", opacity: 0.8, marginLeft: -12 }} />
            </div>
            <div className="absolute flex" style={{ top: 48, left: "50%" }}>
              <div className="rounded-full" style={{ height: 12, width: 24, backgroundColor: "white", opacity: 0.6 }} />
              <div className="rounded-full" style={{ height: 20, width: 32, backgroundColor: "white", opacity: 0.6, marginLeft: -8, marginTop: -4 }} />
              <div className="rounded-full" style={{ height: 12, width: 24, backgroundColor: "white", opacity: 0.6, marginLeft: -8 }} />
            </div>

            {/* Plants grow here */}
            <div className="absolute left-0 right-0" style={{ bottom: 0, height: 140 }}>
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

          {/* Soil layers */}
          <div className="relative">
            {/* Grass line */}
            <div style={{ height: 8, backgroundColor: "#5a8a3c" }} />
            {/* Top soil */}
            <div style={{ height: 24, backgroundColor: "#6b4c2a" }}>
              {/* Soil texture dots */}
              <div className="flex items-center justify-around h-full px-4" style={{ opacity: 0.3 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      height: i % 2 === 0 ? 6 : 4,
                      width: i % 2 === 0 ? 6 : 4,
                      backgroundColor: i % 2 === 0 ? "#5c3d1f" : "#8b6342",
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Deep soil */}
            <div style={{ height: 16, backgroundColor: "#5c3d1f", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
          </div>
        </div>

        {/* Wooden planter sides */}
        <div
          className="absolute"
          style={{
            left: -4,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: "#8b6342",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        />
        <div
          className="absolute"
          style={{
            right: -4,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: "#8b6342",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      </div>

      {/* Stats & controls */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground font-sans">
          {seedsDropped} seed{seedsDropped !== 1 ? "s" : ""} planted
        </span>
        {plants.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors font-sans"
          >
            Clear garden
          </button>
        )}
      </div>
    </div>
  )
}
