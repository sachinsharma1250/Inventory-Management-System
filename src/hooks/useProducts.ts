import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"
import {
  productsCol,
  categoriesCol,
  stockLevelsCol,
  stockLedgerCol,
  typedDoc,
} from "@/lib/firestore"
import { triggerReorderCheck } from "@/functions/reorderLogic"
import type { Product, ProductCategory, StockLevel, StockLedgerEntry } from "@/types"

const PRODUCTS_STORAGE_KEY = "stocksense_products_store"
const CATEGORIES_STORAGE_KEY = "stocksense_categories_store"

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: "cat-raw", name: "Raw Materials", description: "Base manufacturing materials and ingots" },
  { id: "cat-steel", name: "Steel & Metals", description: "Structural steel rods, plates, and tubes" },
  { id: "cat-parts", name: "Components & Fasteners", description: "Bolts, brackets, and subassemblies" },
  { id: "cat-finished", name: "Finished Goods", description: "Manufactured products ready for delivery" },
  { id: "cat-packaging", name: "Packaging", description: "Pallets, shrink wrap, and shipping boxes" },
]

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-desk",
    name: "Desk",
    sku: "DSK-OFF-001",
    categoryId: "cat-finished",
    uom: "units",
    reorderPoint: 10,
    costPerUnit: 3000,
    barcode: "890123456801",
    initialStock: 50,
    lowStock: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "prod-table",
    name: "Table",
    sku: "TBL-OFF-002",
    categoryId: "cat-finished",
    uom: "units",
    reorderPoint: 10,
    costPerUnit: 3000,
    barcode: "890123456802",
    initialStock: 50,
    lowStock: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "prod-steel-rods",
    name: "Steel Rods 10mm",
    sku: "ROD-STL-001",
    categoryId: "cat-steel",
    uom: "kg",
    reorderPoint: 50,
    costPerUnit: 4.5,
    barcode: "890123456789",
    initialStock: 120,
    lowStock: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: "prod-ind-chairs",
    name: "Industrial Steel Chair",
    sku: "CHR-IND-002",
    categoryId: "cat-finished",
    uom: "units",
    reorderPoint: 20,
    costPerUnit: 45.0,
    barcode: "890123456790",
    initialStock: 60,
    lowStock: false,
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9,
  },
  {
    id: "prod-m8-bolts",
    name: "M8 Hex Bolts (100pk)",
    sku: "BLT-HEX-003",
    categoryId: "cat-parts",
    uom: "boxes",
    reorderPoint: 30,
    costPerUnit: 12.0,
    barcode: "890123456791",
    initialStock: 15, // Below reorderPoint -> Low Stock!
    lowStock: true,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
  {
    id: "prod-shrink-wrap",
    name: "Heavy-Duty Shrink Wrap",
    sku: "WRP-PLT-004",
    categoryId: "cat-packaging",
    uom: "rolls",
    reorderPoint: 10,
    costPerUnit: 18.0,
    barcode: "890123456792",
    initialStock: 0, // 0 -> Out of Stock!
    lowStock: true,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "prod-alu-sheets",
    name: "Aluminum Sheet 2mm",
    sku: "SHT-ALU-005",
    categoryId: "cat-raw",
    uom: "sheets",
    reorderPoint: 25,
    costPerUnit: 28.5,
    barcode: "890123456793",
    initialStock: 80,
    lowStock: false,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
]

const getFallbackProducts = (): Product[] => {
  const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS))
  return DEFAULT_PRODUCTS
}

const saveFallbackProducts = (prods: Product[]) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(prods))
}

const getFallbackCategories = (): ProductCategory[] => {
  const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES))
  return DEFAULT_CATEGORIES
}

const saveFallbackCategories = (cats: ProductCategory[]) => {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats))
}

/**
 * Check if a SKU code already exists in Firestore or local fallback
 */
export async function checkSkuExists(sku: string, excludeProductId?: string): Promise<boolean> {
  const cleanSku = sku.trim().toUpperCase()
  if (!cleanSku) return false

  try {
    const q = query(productsCol, where("sku", "==", cleanSku))
    const snap = await getDocs(q)
    if (!snap.empty) {
      if (excludeProductId) {
        return snap.docs.some((d) => d.id !== excludeProductId)
      }
      return true
    }
  } catch (err) {
    console.warn("Direct Firestore SKU check fallback:", err)
  }

  // Fallback store check
  const fallback = getFallbackProducts()
  return fallback.some(
    (p) => p.sku.toUpperCase() === cleanSku && p.id !== excludeProductId
  )
}

/**
 * Direct lookup by barcode for scanner functionality
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const cleanCode = barcode.trim()
  if (!cleanCode) return null

  try {
    const q = query(productsCol, where("barcode", "==", cleanCode))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return snap.docs[0].data()
    }
  } catch (err) {
    console.warn("Barcode search in Firestore fallback:", err)
  }

  const fallback = getFallbackProducts()
  return fallback.find((p) => p.barcode === cleanCode) || null
}

/**
 * Hook to retrieve categories with live Firestore onSnapshot sync
 */
export function useCategories() {
  const queryClient = useQueryClient()

  useEffect(() => {
    try {
      const q = query(categoriesCol, orderBy("name", "asc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            queryClient.setQueryData(["categories"], list)
            saveFallbackCategories(list)
          } else {
            queryClient.setQueryData(["categories"], getFallbackCategories())
          }
        },
        () => queryClient.setQueryData(["categories"], getFallbackCategories())
      )
      return () => unsub()
    } catch {
      queryClient.setQueryData(["categories"], getFallbackCategories())
    }
  }, [queryClient])

  const queryResult = useQuery<ProductCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const snap = await getDocs(categoriesCol)
        if (!snap.empty) return snap.docs.map((d) => d.data())
      } catch {}
      return getFallbackCategories()
    },
    staleTime: Infinity,
  })

  return {
    categories: queryResult.data || getFallbackCategories(),
    isLoading: queryResult.isLoading,
  }
}

/**
 * Mutation to create a new ProductCategory inline
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<ProductCategory, "id"> & { id?: string }) => {
      const id = data.id || `cat-${data.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`
      const newCat: ProductCategory = { ...data, id }

      try {
        await setDoc(doc(categoriesCol, id), newCat)
      } catch {
        const current = getFallbackCategories()
        const updated = [...current, newCat]
        saveFallbackCategories(updated)
        queryClient.setQueryData(["categories"], updated)
      }
      return newCat
    },
    onSuccess: (newCat) => {
      queryClient.setQueryData<ProductCategory[]>(["categories"], (old) => {
        if (!old) return [newCat]
        return [...old.filter((c) => c.id !== newCat.id), newCat]
      })
    },
  })
}

/**
 * Hook to retrieve products with search, category filter, and real-time Firestore sync
 */
export function useProducts(searchQuery: string = "", categoryId: string = "all") {
  const queryClient = useQueryClient()

  useEffect(() => {
    try {
      const q = query(productsCol, orderBy("name", "asc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            queryClient.setQueryData(["products"], list)
            saveFallbackProducts(list)
          } else {
            queryClient.setQueryData(["products"], getFallbackProducts())
          }
        },
        () => queryClient.setQueryData(["products"], getFallbackProducts())
      )
      return () => unsub()
    } catch {
      queryClient.setQueryData(["products"], getFallbackProducts())
    }
  }, [queryClient])

  const queryResult = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const snap = await getDocs(productsCol)
        if (!snap.empty) return snap.docs.map((d) => d.data())
      } catch {}
      return getFallbackProducts()
    },
    staleTime: Infinity,
  })

  const allProducts = queryResult.data || getFallbackProducts()

  // Client-side search and category filtering for high responsiveness
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchQuery))

      const matchesCategory =
        categoryId === "all" || product.categoryId === categoryId

      return matchesSearch && matchesCategory
    })
  }, [allProducts, searchQuery, categoryId])

  return {
    ...queryResult,
    products: filteredProducts,
    allProducts,
  }
}

/**
 * Mutation to create a product.
 *
 * Implements requirement:
 * "create product (name, SKU/code, category, UoM, optional initial stock —
 *  writing an initial stock_levels doc and one stock_ledger entry with
 *  refType='adjustment' if initial stock > 0)"
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: Omit<Product, "id" | "createdAt" | "updatedAt"> & {
        id?: string
        locationId?: string
      }
    ) => {
      const id = input.id || `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
      const initialStock = Number(input.initialStock) || 0
      const reorderPoint = Number(input.reorderPoint) || 0
      const targetLocationId = input.locationId || "loc-main-stock"

      const newProduct: Product = {
        id,
        name: input.name,
        sku: input.sku.toUpperCase().trim(),
        categoryId: input.categoryId,
        uom: input.uom,
        reorderPoint,
        costPerUnit: Number(input.costPerUnit) || 0,
        barcode: input.barcode?.trim() || undefined,
        initialStock,
        lowStock: initialStock <= reorderPoint,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        // 1. Write product doc
        await setDoc(doc(productsCol, id), newProduct)

        // 2. If initial stock > 0, write an initial stock_levels doc and one stock_ledger entry
        if (initialStock > 0) {
          const levelId = `${id}_${targetLocationId}`
          const newLevel: StockLevel = {
            productId: id,
            locationId: targetLocationId,
            onHand: initialStock,
            freeToUse: initialStock,
            updatedAt: Date.now(),
          }
          await setDoc(doc(stockLevelsCol, levelId), newLevel)

          const ledgerId = `ledger-init-${Date.now().toString(36)}`
          const newLedgerEntry: StockLedgerEntry = {
            id: ledgerId,
            productId: id,
            locationId: targetLocationId,
            qtyDelta: initialStock,
            refType: "adjustment",
            refId: `INIT-${id}`,
            timestamp: Date.now(),
            userId: "manager",
            notes: "Initial stock on product creation",
          }
          await setDoc(doc(stockLedgerCol, ledgerId), newLedgerEntry)
        }

        // 3. Trigger reorder logic check if needed
        await triggerReorderCheck(id, targetLocationId)
      } catch (err) {
        console.warn("Firestore product creation fallback to local storage:", err)
        const currentProds = getFallbackProducts()
        const updatedProds = [newProduct, ...currentProds]
        saveFallbackProducts(updatedProds)
        queryClient.setQueryData(["products"], updatedProds)
      }

      return newProduct
    },
    onSuccess: (newProduct) => {
      queryClient.setQueryData<Product[]>(["products"], (old) => {
        if (!old) return [newProduct]
        return [newProduct, ...old.filter((p) => p.id !== newProduct.id)]
      })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["stock_levels"] })
    },
  })
}

/**
 * Mutation to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const payload = {
        ...updates,
        sku: updates.sku ? updates.sku.toUpperCase().trim() : undefined,
        updatedAt: Date.now(),
      }

      try {
        const prodRef = typedDoc<Product>("products", id)
        await updateDoc(prodRef, payload)
        await triggerReorderCheck(id)
      } catch {
        const current = getFallbackProducts()
        const updated = current.map((p) => (p.id === id ? { ...p, ...payload } : p))
        saveFallbackProducts(updated)
        queryClient.setQueryData(["products"], updated)
      }

      return { id, ...payload }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
    },
  })
}
