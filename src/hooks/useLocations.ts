import { useEffect } from "react"
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
import { locationsCol, typedDoc } from "@/lib/firestore"
import type { Location } from "@/types"

const LOCATIONS_STORAGE_KEY = "stocksense_locations_store"

const DEFAULT_LOCATIONS: Location[] = [
  {
    id: "loc-main-stock",
    name: "Main Storage Zone",
    shortCode: "WH1/Stock",
    warehouseId: "wh-main",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: "loc-main-racka",
    name: "Rack A (Fast Pick)",
    shortCode: "WH1/Rack-A",
    warehouseId: "wh-main",
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9,
  },
  {
    id: "loc-main-rackb",
    name: "Rack B (Bulk Shelving)",
    shortCode: "WH1/Rack-B",
    warehouseId: "wh-main",
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
  {
    id: "loc-main-prod",
    name: "Production Assembly Floor",
    shortCode: "WH1/Prod",
    warehouseId: "wh-main",
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "loc-east-stock",
    name: "East Terminal Floor",
    shortCode: "WH2/Stock",
    warehouseId: "wh-east",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "loc-east-rack1",
    name: "Aisle 1 Heavy Pallets",
    shortCode: "WH2/Rack-1",
    warehouseId: "wh-east",
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
]

const getFallbackLocations = (): Location[] => {
  const saved = localStorage.getItem(LOCATIONS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // fallback
    }
  }
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_LOCATIONS))
  return DEFAULT_LOCATIONS
}

const saveFallbackLocations = (locations: Location[]) => {
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations))
}

/**
 * Hook to retrieve and subscribe to real-time warehouse locations via Firestore onSnapshot
 */
export function useLocations(warehouseId?: string) {
  const queryClient = useQueryClient()
  const cacheKey = ["locations", warehouseId || "all"]

  useEffect(() => {
    let isSubscribed = true

    try {
      const q = warehouseId && warehouseId !== "all"
        ? query(locationsCol, where("warehouseId", "==", warehouseId))
        : query(locationsCol, orderBy("shortCode", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isSubscribed) return
          if (!snapshot.empty) {
            const list = snapshot.docs.map((docSnap) => docSnap.data())
            queryClient.setQueryData(cacheKey, list)
            // also update global fallback cache
            if (!warehouseId || warehouseId === "all") {
              saveFallbackLocations(list)
            }
          } else {
            // fallback
            const all = getFallbackLocations()
            const filtered = warehouseId && warehouseId !== "all"
              ? all.filter((l) => l.warehouseId === warehouseId)
              : all
            queryClient.setQueryData(cacheKey, filtered)
          }
        },
        (error) => {
          console.warn("Firestore locations live snapshot unavailable (using fallback):", error.message)
          const all = getFallbackLocations()
          const filtered = warehouseId && warehouseId !== "all"
            ? all.filter((l) => l.warehouseId === warehouseId)
            : all
          queryClient.setQueryData(cacheKey, filtered)
        }
      )

      return () => {
        isSubscribed = false
        unsubscribe()
      }
    } catch (e) {
      console.warn("Could not attach locations onSnapshot listener:", e)
    }
  }, [queryClient, warehouseId])

  const queryResult = useQuery<Location[]>({
    queryKey: cacheKey,
    queryFn: async () => {
      try {
        const q = warehouseId && warehouseId !== "all"
          ? query(locationsCol, where("warehouseId", "==", warehouseId))
          : query(locationsCol, orderBy("shortCode", "asc"))
        const snap = await getDocs(q)
        if (!snap.empty) {
          return snap.docs.map((d) => d.data())
        }
      } catch (err) {
        console.warn("Direct Firestore getDocs for locations failed, using local store:", err)
      }
      const all = getFallbackLocations()
      return warehouseId && warehouseId !== "all"
        ? all.filter((l) => l.warehouseId === warehouseId)
        : all
    },
    staleTime: Infinity, // Driven by onSnapshot
  })

  return {
    ...queryResult,
    locations: queryResult.data || [],
  }
}

/**
 * Mutation hook to create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Location, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const id = data.id || `loc-${data.shortCode.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`
      const newLocation: Location = {
        ...data,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        const docRef = doc(locationsCol, id)
        await setDoc(docRef, newLocation)
      } catch (err) {
        console.warn("Firestore setDoc failed, saving to local fallback store:", err)
        const current = getFallbackLocations()
        const updated = [...current, newLocation]
        saveFallbackLocations(updated)
        queryClient.setQueryData(["locations", "all"], updated)
      }

      return newLocation
    },
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
  })
}

/**
 * Mutation hook to update an existing location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Location> & { id: string }) => {
      const updatePayload = {
        ...data,
        updatedAt: Date.now(),
      }

      try {
        const docRef = typedDoc<Location>("locations", id)
        await updateDoc(docRef, updatePayload)
      } catch (err) {
        console.warn("Firestore updateDoc failed, modifying local fallback store:", err)
        const current = getFallbackLocations()
        const updated = current.map((l) => (l.id === id ? { ...l, ...updatePayload } : l))
        saveFallbackLocations(updated)
        queryClient.setQueryData(["locations", "all"], updated)
      }

      return { id, ...updatePayload }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
  })
}

/**
 * Mutation hook to delete a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const docRef = typedDoc<Location>("locations", id)
        await deleteDoc(docRef)
      } catch (err) {
        console.warn("Firestore deleteDoc failed, removing from local fallback store:", err)
        const current = getFallbackLocations()
        const updated = current.filter((l) => l.id !== id)
        saveFallbackLocations(updated)
        queryClient.setQueryData(["locations", "all"], updated)
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
  })
}
