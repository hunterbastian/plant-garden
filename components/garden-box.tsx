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

const PLANT_TYPES: PlantType[] = ["bamboo", "bonsai", "moss", "orchid"]

export function GardenBox() {
  const [plants, setPlants] = useState<PlantData[]>([])
  const [nextId, setNextId] = useState(0)
  const [seedsDropped, setSeedsDropped] = useState(0)

  const handleShake = useCallback(() => {
    const numSeeds = Math.floor(Math.random() * 2) + 1
    const newPlants: PlantData[] = []

    for (let i = 0; i < numSeeds; i++) {
      const x = 10 + Math.random() * 80
      const type = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)]
      const stages: PlantStage[] = ["sprout", "growing", "blooming"]
      const stage = stages[Math.floor(Math.random() * stages.length)]

      newPlants.push({
        id: nextId + i,
        x,
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
          {"seed"}
        </h1>
        <div
          className="mx-auto mt-3"
          style={{ width: 24, height: 1, backgroundColor: "#3d3832", opacity: 0.3 }}
        />
        <p className="text-xs text-muted-foreground mt-3 font-sans tracking-widest uppercase">
          shake to plant
        </p>
      </div>

      {/* Seed bag */}
      <SeedBag onShake={handleShake} />

      {/* Garden scene */}
      <div className="relative w-full" style={{ minWidth: 300 }}>
        <div
          className="relative overflow-hidden"
          style={{
            border: "1px solid #d6cfc4",
            borderRadius: 2,
            backgroundColor: "#f5f2ed",
          }}
        >
          {/* Empty space / sky - very minimal, just a soft warm white */}
          <div className="relative" style={{ height: 220 }}>
            {/* Subtle ink-wash circle in background like an enso */}
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

          {/* Ground - simple stone/sand line */}
          <div className="relative">
            {/* Fine line */}
            <div style={{ height: 1, backgroundColor: "#c4bdb2" }} />
            {/* Sand/earth area */}
            <div
              className="flex items-center justify-around px-8"
              style={{ height: 28, backgroundColor: "#ece7df" }}
            >
              {/* Tiny pebble marks */}
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
            {/* Darker earth */}
            <div style={{ height: 8, backgroundColor: "#d6cfc4", borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
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
