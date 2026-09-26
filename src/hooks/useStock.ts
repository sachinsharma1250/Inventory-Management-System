import { useEffect, useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, query, getDocs } from "firebase/firestore"
import {
  stockLevelsCol,
  productsCol,
  deliveriesCol,
  locationsCol,
  categoriesCol,
} from "@/lib/firestore"
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES } from "./useProducts"
import type { StockLevel, Product, Delivery, Location, ProductCategory } from "@/types"

export interface StockItemView {
  id: string
  productId: string
  productName: string
  sku: string
  categoryId: string
  categoryName: string
  uom: string
  locationId: string
  locationName: string
  costPerUnit: number
  onHand: number
  freeToUse: number
  allocated: number
  reorderPoint: number
  isLowStock: boolean
  isOutOfStock: boolean
}

const STOCK_LEVELS_STORAGE_KEY = "stocksense_stock_levels_store"

const DEFAULT_STOCK_LEVELS: StockLevel[] = [
  { productId: "prod-desk", locationId: "loc-main-stock", onHand: 50, freeToUse: 45 },
  { productId: "prod-table", locationId: "loc-main-stock", onHand: 50, freeToUse: 50 },
  { productId: "prod-steel-rods", locationId: "loc-main-stock", onHand: 120, freeToUse: 100 },
  { productId: "prod-ind-chairs", locationId: "loc-main-stock", onHand: 60, freeToUse: 50 },
  { productId: "prod-m8-bolts", locationId: "loc-main-stock", onHand: 15, freeToUse: 15 },
  { productId: "prod-shrink-wrap", locationId: "loc-main-stock", onHand: 0, freeToUse: 0 },
  { productId: "prod-alu-sheets", locationId: "loc-main-stock", onHand: 80, freeToUse: 75 },
  { productId: "prod-steel-rods", locationId: "loc-main-racka", onHand: 35, freeToUse: 35 },
]

const getFallbackStockLevels = (): StockLevel[] => {
  const saved = localStorage.getItem(STOCK_LEVELS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(STOCK_LEVELS_STORAGE_KEY, JSON.stringify(DEFAULT_STOCK_LEVELS))
  return DEFAULT_STOCK_LEVELS
}

export function useStock(searchQuery: string = "", categoryId: string = "all", locationId: string = "all") {
  const queryClient = useQueryClient()
  const [stockLevels, setStockLevels] = useState<StockLevel[]>(getFallbackStockLevels())
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES)

  // Real-time Firestore sync via onSnapshot
  useEffect(() => {
    const unsubs: (() => void)[] = []

    try {
      unsubs.push(
        onSnapshot(stockLevelsCol, (snap) => {
          if (!snap.empty) {
            setStockLevels(snap.docs.map((d) => d.data()))
          }
        })
      )
      unsubs.push(
        onSnapshot(productsCol, (snap) => {
          if (!snap.empty) {
            setProducts(snap.docs.map((d) => d.data()))
          }
        })
      )
      unsubs.push(
        onSnapshot(deliveriesCol, (snap) => {
          if (!snap.empty) {
            setDeliveries(snap.docs.map((d) => d.data()))
          }
        })
      )
      unsubs.push(
        onSnapshot(locationsCol, (snap) => {
          if (!snap.empty) {
            setLocations(snap.docs.map((d) => d.data()))
          }
        })
      )
      unsubs.push(
        onSnapshot(categoriesCol, (snap) => {
          if (!snap.empty) {
            setCategories(snap.docs.map((d) => d.data()))
          }
        })
      )
    } catch (e) {
      console.warn("Real-time stock listeners running in dev fallback:", e)
    }

    return () => {
      unsubs.forEach((u) => {
        try { u() } catch {}
      })
    }
  }, [])

  // Calculate allocated quantities per (productId + locationId) from open deliveries (waiting or ready)
  const allocatedMap = useMemo(() => {
    const map: Record<string, number> = {}

    deliveries
      .filter((d) => d.status === "waiting" || d.status === "ready")
      .forEach((d) => {
        const sourceLoc = d.from || "loc-main-stock"
        d.lines?.forEach((line) => {
          const key = `${line.productId}_${sourceLoc}`
          map[key] = (map[key] || 0) + (Number(line.quantity) || 0)
        })
      })

    return map
  }, [deliveries])

  // Combine product definitions and location stock levels into enriched view rows
  const stockRows: StockItemView[] = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const locationMap = new Map(locations.map((l) => [l.id, `${l.name} (${l.shortCode})`]))

    const rows: StockItemView[] = []

    // If a product exists but has no stock_level entry yet, create a zero-stock row for main stock
    const productsWithLevels = new Set(stockLevels.map((s) => s.productId))

    products.forEach((prod) => {
      const prodLevels = stockLevels.filter((s) => s.productId === prod.id)

      if (prodLevels.length === 0) {
        // Zero stock representation
        const allocKey = `${prod.id}_loc-main-stock`
        const allocated = allocatedMap[allocKey] || 0
        const onHand = 0
        const freeToUse = 0

        rows.push({
          id: `${prod.id}_loc-main-stock`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          categoryId: prod.categoryId,
          categoryName: categoryMap.get(prod.categoryId) || "General",
          uom: prod.uom,
          locationId: "loc-main-stock",
          locationName: locationMap.get("loc-main-stock") || "Main Store (WH1/Stock)",
          costPerUnit: Number(prod.costPerUnit) || 0,
          onHand,
          freeToUse,
          allocated,
          reorderPoint: Number(prod.reorderPoint) || 0,
          isLowStock: true,
          isOutOfStock: true,
        })
      } else {
        prodLevels.forEach((level) => {
          const onHand = Number(level.onHand) || 0
          const allocKey = `${prod.id}_${level.locationId}`
          const allocated = allocatedMap[allocKey] || 0
          const freeToUse = Math.max(0, onHand - allocated)
          const reorderPoint = Number(prod.reorderPoint) || 0

          rows.push({
            id: `${prod.id}_${level.locationId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            categoryId: prod.categoryId,
            categoryName: categoryMap.get(prod.categoryId) || "General",
            uom: prod.uom,
            locationId: level.locationId,
            locationName: locationMap.get(level.locationId) || level.locationId,
            costPerUnit: Number(prod.costPerUnit) || 0,
            onHand,
            freeToUse,
            allocated,
            reorderPoint,
            isLowStock: onHand <= reorderPoint,
            isOutOfStock: onHand === 0,
          })
        })
      }
    })

    return rows
  }, [stockLevels, products, allocatedMap, locations, categories])

  // Filter rows
  const filteredStockRows = useMemo(() => {
    return stockRows.filter((row) => {
      const matchesSearch =
        !searchQuery ||
        row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.sku.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat = categoryId === "all" || row.categoryId === categoryId
      const matchesLoc = locationId === "all" || row.locationId === locationId

      return matchesSearch && matchesCat && matchesLoc
    })
  }, [stockRows, searchQuery, categoryId, locationId])

  return {
    stock: filteredStockRows,
    allStock: stockRows,
    isLoading: false,
  }
}
