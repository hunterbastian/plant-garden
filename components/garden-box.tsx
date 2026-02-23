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
    <div className="flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Plant Garden
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Shake the seed bag to grow your garden
        </p>
      </div>

      {/* Seed bag area */}
      <SeedBag onShake={handleShake} />

      {/* Garden box */}
      <div className="relative w-full max-w-lg">
        {/* The box frame */}
        <div className="relative overflow-hidden rounded-xl border-2 border-[#8b6342] bg-[#87CEEB]">
          {/* Sky area */}
          <div className="relative h-48">
            {/* Sun */}
            <div className="absolute top-4 right-6 h-10 w-10 rounded-full bg-[#f5c542] shadow-[0_0_20px_rgba(245,197,66,0.5)]" />

            {/* Clouds */}
            <div className="absolute top-6 left-8 flex gap-0">
              <div className="h-4 w-8 rounded-full bg-card opacity-80" />
              <div className="h-6 w-10 rounded-full bg-card opacity-80 -ml-3 -mt-1" />
              <div className="h-4 w-8 rounded-full bg-card opacity-80 -ml-3" />
            </div>
            <div className="absolute top-12 left-1/2 flex gap-0">
              <div className="h-3 w-6 rounded-full bg-card opacity-60" />
              <div className="h-5 w-8 rounded-full bg-card opacity-60 -ml-2 -mt-1" />
              <div className="h-3 w-6 rounded-full bg-card opacity-60 -ml-2" />
            </div>

            {/* Plants grow here */}
            <div className="absolute bottom-0 left-0 right-0 h-32">
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
            <div className="h-2 bg-[#5a8a3c]" />
            {/* Top soil */}
            <div className="h-6 bg-[#6b4c2a]">
              {/* Soil texture dots */}
              <div className="flex items-center justify-around h-full px-4 opacity-30">
                <div className="h-1 w-1 rounded-full bg-[#8b6342]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#5c3d1f]" />
                <div className="h-1 w-1 rounded-full bg-[#8b6342]" />
                <div className="h-1.5 w-1 rounded-full bg-[#5c3d1f]" />
                <div className="h-1 w-1.5 rounded-full bg-[#8b6342]" />
                <div className="h-1 w-1 rounded-full bg-[#5c3d1f]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#8b6342]" />
              </div>
            </div>
            {/* Deep soil */}
            <div className="h-4 bg-[#5c3d1f] rounded-b-lg" />
          </div>
        </div>

        {/* Wooden planter sides */}
        <div className="absolute -left-1 top-0 bottom-0 w-2 bg-[#8b6342] rounded-l-lg" />
        <div className="absolute -right-1 top-0 bottom-0 w-2 bg-[#8b6342] rounded-r-lg" />
      </div>

      {/* Stats & controls */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">
          {seedsDropped} seed{seedsDropped !== 1 ? "s" : ""} planted
        </span>
        {plants.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Clear garden
          </button>
        )}
      </div>
    </div>
  )
}
