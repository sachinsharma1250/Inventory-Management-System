import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  onSnapshot,
  query,
  orderBy,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { warehousesCol, typedDoc } from "@/lib/firestore"
import type { Warehouse } from "@/types"

const WAREHOUSES_STORAGE_KEY = "stocksense_warehouses_store"

const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-main",
    name: "Main Logistics Hub",
    shortCode: "WH1",
    address: "100 Industrial Parkway, Chicago, IL",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: "wh-east",
    name: "East Coast Terminal",
    shortCode: "WH2",
    address: "45 Ocean Port Blvd, Newark, NJ",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
]

const getFallbackWarehouses = (): Warehouse[] => {
  const saved = localStorage.getItem(WAREHOUSES_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // fallback
    }
  }
  localStorage.setItem(WAREHOUSES_STORAGE_KEY, JSON.stringify(DEFAULT_WAREHOUSES))
  return DEFAULT_WAREHOUSES
}

const saveFallbackWarehouses = (warehouses: Warehouse[]) => {
  localStorage.setItem(WAREHOUSES_STORAGE_KEY, JSON.stringify(warehouses))
}

/**
 * Hook to retrieve and subscribe to real-time warehouses via Firestore onSnapshot
 */
export function useWarehouses() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let isSubscribed = true

    try {
      const q = query(warehousesCol, orderBy("name", "asc"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isSubscribed) return
          if (!snapshot.empty) {
            const list = snapshot.docs.map((docSnap) => docSnap.data())
            queryClient.setQueryData(["warehouses"], list)
            saveFallbackWarehouses(list)
          } else {
            // If empty in Firestore, populate with default data in cache
            const fallback = getFallbackWarehouses()
            queryClient.setQueryData(["warehouses"], fallback)
          }
        },
        (error) => {
          console.warn("Firestore warehouses live snapshot unavailable (using fallback):", error.message)
          const fallback = getFallbackWarehouses()
          queryClient.setQueryData(["warehouses"], fallback)
        }
      )

      return () => {
        isSubscribed = false
        unsubscribe()
      }
    } catch (e) {
      console.warn("Could not attach warehouses onSnapshot listener:", e)
    }
  }, [queryClient])

  const queryResult = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      try {
        const snap = await getDocs(warehousesCol)
        if (!snap.empty) {
          return snap.docs.map((d) => d.data())
        }
      } catch (err) {
        console.warn("Direct Firestore getDocs for warehouses failed, using local store:", err)
      }
      return getFallbackWarehouses()
    },
    staleTime: Infinity, // Freshness driven by onSnapshot
  })

  return {
    ...queryResult,
    warehouses: queryResult.data || [],
  }
}

/**
 * Mutation hook to create a new warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Warehouse, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const id = data.id || `wh-${data.shortCode.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`
      const newWarehouse: Warehouse = {
        ...data,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        const docRef = doc(warehousesCol, id)
        await setDoc(docRef, newWarehouse)
      } catch (err) {
        console.warn("Firestore setDoc failed, saving to local fallback store:", err)
        const current = getFallbackWarehouses()
        const updated = [...current, newWarehouse]
        saveFallbackWarehouses(updated)
        queryClient.setQueryData(["warehouses"], updated)
      }

      return newWarehouse
    },
    onSuccess: (newWarehouse) => {
      queryClient.setQueryData<Warehouse[]>(["warehouses"], (old) => {
        if (!old) return [newWarehouse]
        if (old.some((w) => w.id === newWarehouse.id)) {
          return old.map((w) => (w.id === newWarehouse.id ? newWarehouse : w))
        }
        return [...old, newWarehouse]
      })
    },
  })
}

/**
 * Mutation hook to update an existing warehouse
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Warehouse> & { id: string }) => {
      const updatePayload = {
        ...data,
        updatedAt: Date.now(),
      }

      try {
        const docRef = typedDoc<Warehouse>("warehouses", id)
        await updateDoc(docRef, updatePayload)
      } catch (err) {
        console.warn("Firestore updateDoc failed, modifying local fallback store:", err)
        const current = getFallbackWarehouses()
        const updated = current.map((w) => (w.id === id ? { ...w, ...updatePayload } : w))
        saveFallbackWarehouses(updated)
        queryClient.setQueryData(["warehouses"], updated)
      }

      return { id, ...updatePayload }
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData<Warehouse[]>(["warehouses"], (old) => {
        if (!old) return []
        return old.map((w) => (w.id === updatedData.id ? { ...w, ...updatedData } : w))
      })
    },
  })
}

/**
 * Mutation hook to delete a warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const docRef = typedDoc<Warehouse>("warehouses", id)
        await deleteDoc(docRef)
      } catch (err) {
        console.warn("Firestore deleteDoc failed, removing from local fallback store:", err)
        const current = getFallbackWarehouses()
        const updated = current.filter((w) => w.id !== id)
        saveFallbackWarehouses(updated)
        queryClient.setQueryData(["warehouses"], updated)
      }
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Warehouse[]>(["warehouses"], (old) => {
        if (!old) return []
        return old.filter((w) => w.id !== deletedId)
      })
    },
  })
}
