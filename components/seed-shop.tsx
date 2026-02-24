"use client"

import { useState } from "react"
import type { PlantType } from "./plant"

export interface SeedItem {
  type: PlantType
  name: string
  price: number
  description: string
  owned: number
}

const SEED_CATALOG: Omit<SeedItem, "owned">[] = [
  { type: "bamboo", name: "Bamboo", price: 0, description: "Tall and resilient" },
  { type: "bonsai", name: "Bonsai", price: 3, description: "Patient and wise" },
  { type: "moss", name: "Moss", price: 2, description: "Soft and quiet" },
  { type: "orchid", name: "Orchid", price: 5, description: "Rare elegance" },
]

function SeedPreview({ type }: { type: PlantType }) {
  const previewMap: Record<PlantType, React.ReactNode> = {
    bamboo: (
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <line x1="14" y1="36" x2="14" y2="8" stroke="#6b7a5e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 12 Q8 6 4 8" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 12 Q20 6 24 8" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 20 Q9 16 7 18" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 20 Q19 16 21 18" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    bonsai: (
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path d="M14 36 Q13 24 14 16" fill="none" stroke="#5a4e42" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="12" r="7" fill="#6b7a5e" opacity="0.3" />
        <circle cx="10" cy="10" r="4" fill="#6b7a5e" opacity="0.25" />
        <circle cx="18" cy="10" r="4" fill="#6b7a5e" opacity="0.25" />
        <circle cx="14" cy="8" r="3" fill="#6b7a5e" opacity="0.35" />
      </svg>
    ),
    moss: (
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path d="M14 36 Q13 24 14 18" fill="none" stroke="#6b7a5e" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="14" r="6" fill="#8a9e7a" opacity="0.35" />
        <circle cx="10" cy="12" r="4" fill="#8a9e7a" opacity="0.3" />
        <circle cx="18" cy="12" r="4" fill="#8a9e7a" opacity="0.3" />
        <path d="M14 26 Q9 22 7 24" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 26 Q19 22 21 24" fill="none" stroke="#7d8e6e" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    orchid: (
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path d="M14 36 Q13 22 14 14" fill="none" stroke="#6b7a5e" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="14" cy="10" rx="4" ry="5" fill="#b8a0a0" opacity="0.4" />
        <ellipse cx="10" cy="8" rx="3" ry="4" fill="#b8a0a0" opacity="0.3" transform="rotate(-15 10 8)" />
        <ellipse cx="18" cy="8" rx="3" ry="4" fill="#b8a0a0" opacity="0.3" transform="rotate(15 18 8)" />
        <circle cx="14" cy="9" r="2" fill="#b8a0a0" opacity="0.5" />
      </svg>
    ),
  }
  return <>{previewMap[type]}</>
}

interface SeedShopProps {
  coins: number
  coinPop?: boolean
  selectedSeed: PlantType
  onSelectSeed: (type: PlantType) => void
  onBuySeed: (type: PlantType, price: number) => void
  inventory: Record<PlantType, number>
}

export function SeedShop({ coins, coinPop, selectedSeed, onSelectSeed, onBuySeed, inventory }: SeedShopProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Shop toggle -- 44px min touch target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute z-30 flex items-center justify-center transition-all duration-300"
        style={{
          top: 8,
          left: 8,
          width: 44,
          height: 44,
          cursor: "pointer",
        }}
        aria-label={isOpen ? "Close seed shop" : "Open seed shop"}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <line x1="4" y1="8" x2="24" y2="8" stroke="#3d3832" strokeWidth="1.5" strokeLinecap="round" opacity={isOpen ? 0.8 : 0.35} />
          <line x1="6" y1="5" x2="22" y2="5" stroke="#3d3832" strokeWidth="1" strokeLinecap="round" opacity={isOpen ? 0.6 : 0.25} />
          <line x1="8" y1="8" x2="7" y2="24" stroke="#3d3832" strokeWidth="1.3" strokeLinecap="round" opacity={isOpen ? 0.8 : 0.35} />
          <line x1="20" y1="8" x2="21" y2="24" stroke="#3d3832" strokeWidth="1.3" strokeLinecap="round" opacity={isOpen ? 0.8 : 0.35} />
          <line x1="7" y1="14" x2="21" y2="14" stroke="#3d3832" strokeWidth="0.8" strokeLinecap="round" opacity={isOpen ? 0.5 : 0.2} />
        </svg>
      </button>

      {/* Backdrop on mobile to close shop by tapping outside */}
      {isOpen && (
        <div
          className="absolute inset-0 z-[25]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Shop panel */}
      <div
        className="absolute z-30 transition-all duration-500 ease-out"
        style={{
          top: 52,
          left: isOpen ? 8 : -240,
          width: "min(220px, calc(100% - 16px))",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(245, 242, 237, 0.97)",
            border: "1px solid #d6cfc4",
            borderRadius: 2,
            padding: "14px 12px",
          }}
        >
          {/* Coins display */}
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#3d3832" strokeWidth="0.8" opacity="0.5" />
              <rect x="5" y="5" width="4" height="4" rx="0.5" stroke="#3d3832" strokeWidth="0.6" opacity="0.4" />
            </svg>
            <span
              className={`text-sm font-sans tracking-widest text-foreground ${coinPop ? "animate-coin-pop" : ""}`}
              style={{ opacity: 0.6 }}
            >
              {coins}
            </span>
          </div>

          {/* Seed list */}
          <div className="flex flex-col gap-1">
            {SEED_CATALOG.map((seed, idx) => {
              const owned = inventory[seed.type] ?? 0
              const isSelected = selectedSeed === seed.type
              const canAfford = coins >= seed.price || seed.price === 0
              const isUnlocked = owned > 0 || seed.price === 0

              return (
                <button
                  key={seed.type}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectSeed(seed.type)
                    } else if (canAfford) {
                      onBuySeed(seed.type, seed.price)
                    }
                  }}
                  className="flex items-center gap-3 w-full text-left transition-all duration-200"
                  style={{
                    padding: "10px 8px",
                    minHeight: 48,
                    borderRadius: 2,
                    border: isSelected ? "1px solid #3d3832" : "1px solid transparent",
                    opacity: isOpen ? (!isUnlocked && !canAfford ? 0.35 : 1) : 0,
                    backgroundColor: isSelected ? "rgba(61, 56, 50, 0.04)" : "transparent",
                    cursor: !isUnlocked && !canAfford ? "default" : "pointer",
                    transform: isOpen ? "translateX(0)" : "translateX(-12px)",
                    transitionDelay: isOpen ? `${idx * 60}ms` : "0ms",
                  }}
                  disabled={!isUnlocked && !canAfford}
                >
                  <div className="flex-shrink-0" style={{ width: 28, height: 36 }}>
                    <SeedPreview type={seed.type} />
                  </div>
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-sm font-serif tracking-wider text-foreground" style={{ opacity: 0.7 }}>
                      {seed.name}
                    </span>
                    <span className="text-xs font-sans text-muted-foreground">
                      {seed.description}
                    </span>
                    {!isUnlocked && (
                      <span className="text-xs font-sans text-muted-foreground">
                        {seed.price} coins
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs font-sans tracking-widest uppercase text-muted-foreground" style={{ fontSize: 10 }}>
                        selected
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
