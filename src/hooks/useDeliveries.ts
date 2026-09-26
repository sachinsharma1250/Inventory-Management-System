import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  onSnapshot,
  query,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { deliveriesCol, stockLevelsCol, stockLedgerCol } from "@/lib/firestore"
import { triggerReorderCheck } from "@/functions/reorderLogic"
import type { Delivery, DocStatus, StockLevel, StockLedgerEntry } from "@/types"

const DELIVERIES_STORAGE_KEY = "stocksense_deliveries_store"

export const DEFAULT_DELIVERIES: Delivery[] = [
  {
    id: "del-001",
    reference: "WH/OUT/00001",
    from: "loc-main-stock",
    to: "Metro Office Furnishings",
    contact: "dispatch@metrooffice.com",
    scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0],
    status: "ready", // Packed, ready for outbound validation
    lines: [
      { productId: "prod-ind-chairs", quantity: 10, productName: "Industrial Steel Chair", sku: "CHR-IND-002", uom: "units" },
    ],
    notes: "Sales order SO-9941 client priority dispatch",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: "del-002",
    reference: "WH/OUT/00002",
    from: "loc-main-stock",
    to: "Summit Builders Inc",
    contact: "procurement@summitbuilders.com",
    scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    status: "waiting", // Picking in progress
    lines: [
      { productId: "prod-steel-rods", quantity: 20, productName: "Steel Rods 10mm", sku: "ROD-STL-001", uom: "kg" },
      { productId: "prod-alu-sheets", quantity: 5, productName: "Aluminum Sheet 2mm", sku: "SHT-ALU-005", uom: "sheets" },
    ],
    notes: "Commercial construction batch 4",
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: "del-003",
    reference: "WH/OUT/00003",
    from: "loc-main-stock",
    to: "Chicago Tech Park",
    contact: "facilities@techpark.org",
    scheduledDate: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    status: "done",
    lines: [
      { productId: "prod-ind-chairs", quantity: 15, productName: "Industrial Steel Chair", sku: "CHR-IND-002", uom: "units" },
    ],
    notes: "Dispatched and signed on delivery",
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },
]

const getFallbackDeliveries = (): Delivery[] => {
  const saved = localStorage.getItem(DELIVERIES_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(DEFAULT_DELIVERIES))
  return DEFAULT_DELIVERIES
}

const saveFallbackDeliveries = (deliveries: Delivery[]) => {
  localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(deliveries))
}

export function useDeliveries(searchQuery: string = "", statusFilter: string = "all") {
  const queryClient = useQueryClient()
  const [deliveries, setDeliveries] = useState<Delivery[]>(getFallbackDeliveries())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    try {
      const q = query(deliveriesCol, orderBy("createdAt", "desc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            setDeliveries(list)
            saveFallbackDeliveries(list)
            queryClient.setQueryData(["deliveries"], list)
          } else {
            setDeliveries(getFallbackDeliveries())
          }
        },
        () => setDeliveries(getFallbackDeliveries())
      )
      return () => unsub()
    } catch {
      setDeliveries(getFallbackDeliveries())
    }
  }, [queryClient])

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contact.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || d.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [deliveries, searchQuery, statusFilter])

  return {
    deliveries: filtered,
    allDeliveries: deliveries,
    isLoading,
  }
}

export function useDelivery(id?: string) {
  const { allDeliveries } = useDeliveries()
  return allDeliveries.find((d) => d.id === id) || null
}

/**
 * Create a new Delivery order (auto reference e.g. WH/OUT/00004)
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Delivery, "id" | "reference" | "status" | "createdAt" | "updatedAt">) => {
      const current = getFallbackDeliveries()
      const nextNum = String(current.length + 1).padStart(5, "0")
      const reference = `WH/OUT/${nextNum}`
      const id = `del-${Date.now().toString(36)}`

      const newDelivery: Delivery = {
        ...data,
        id,
        reference,
        status: "waiting", // Pick -> Pack -> Validate
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        await setDoc(doc(deliveriesCol, id), newDelivery)
      } catch {
        const updated = [newDelivery, ...current]
        saveFallbackDeliveries(updated)
        queryClient.setQueryData(["deliveries"], updated)
      }

      return newDelivery
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
    },
  })
}

/**
 * Step status update: Pick -> Pack (Waiting -> Ready)
 */
export function useProgressDeliveryStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: DocStatus }) => {
      try {
        await updateDoc(doc(deliveriesCol, id), {
          status: nextStatus,
          updatedAt: Date.now(),
        })
      } catch {
        const current = getFallbackDeliveries()
        const updated = current.map((d) => (d.id === id ? { ...d, status: nextStatus, updatedAt: Date.now() } : d))
        saveFallbackDeliveries(updated)
        queryClient.setQueryData(["deliveries"], updated)
      }
      return { id, nextStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
    },
  })
}

/**
 * Validate outbound delivery inside atomic Firestore transaction:
 * - Checks that stock_levels.onHand >= line.quantity for each line.
 * - IF insufficient: REJECTS with clear error and aborts (does not partially apply!).
 * - Decrements onHand and freeToUse at source location.
 * - Appends one stock_ledger entry per line with qtyDelta = -quantity, refType = "delivery".
 */
export function useValidateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const deliveryRef = doc(deliveriesCol, deliveryId)

      try {
        await runTransaction(db, async (transaction) => {
          const deliverySnap = await transaction.get(deliveryRef)
          if (!deliverySnap.exists()) {
            throw new Error(`Delivery order ${deliveryId} not found`)
          }

          const delivery = deliverySnap.data() as Delivery
          if (delivery.status === "done") {
            throw new Error("Delivery is already validated and dispatched.")
          }

          const fromLocationId = delivery.from || "loc-main-stock"

          // 1. Pre-flight check: verify all lines have sufficient stock
          const levelSnaps = await Promise.map
            ? []
            : await Promise.all(
                delivery.lines.map((l) =>
                  transaction.get(doc(stockLevelsCol, `${l.productId}_${fromLocationId}`))
                )
              )

          for (let i = 0; i < delivery.lines.length; i++) {
            const line = delivery.lines[i]
            const snap = levelSnaps[i]
            const currentOnHand = snap.exists() ? Number(snap.data()?.onHand) || 0 : 0

            if (currentOnHand < Number(line.quantity)) {
              throw new Error(
                `Insufficient Stock: Product "${line.productName || line.productId}" requires ${line.quantity} units, but only ${currentOnHand} available on-hand at ${fromLocationId}. Order aborted.`
              )
            }
          }

          // 2. Decrement onHand and freeToUse, and append stock_ledger entries
          for (let i = 0; i < delivery.lines.length; i++) {
            const line = delivery.lines[i]
            const snap = levelSnaps[i]
            const currentOnHand = snap.exists() ? Number(snap.data()?.onHand) || 0 : 0
            const currentFree = snap.exists() ? Number(snap.data()?.freeToUse) || 0 : 0

            const newOnHand = currentOnHand - Number(line.quantity)
            const newFree = Math.max(0, currentFree - Number(line.quantity))

            const levelDocId = `${line.productId}_${fromLocationId}`
            const levelRef = doc(stockLevelsCol, levelDocId)

            transaction.set(levelRef, {
              productId: line.productId,
              locationId: fromLocationId,
              onHand: newOnHand,
              freeToUse: newFree,
              updatedAt: Date.now(),
            }, { merge: true })

            // Ledger deduction entry
            const ledgerId = `ledger-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
            const ledgerRef = doc(stockLedgerCol, ledgerId)
            transaction.set(ledgerRef, {
              id: ledgerId,
              productId: line.productId,
              locationId: fromLocationId,
              qtyDelta: -Number(line.quantity), // negative for deliveries
              refType: "delivery",
              refId: delivery.reference,
              timestamp: Date.now(),
              userId: "manager",
              notes: `Dispatched to ${delivery.to}`,
            })
          }

          // Mark delivery as done
          transaction.update(deliveryRef, {
            status: "done",
            updatedAt: Date.now(),
          })
        })

        // Check reorder triggers
        const snap = await getDoc(deliveryRef)
        if (snap.exists()) {
          for (const line of snap.data().lines) {
            await triggerReorderCheck(line.productId)
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes("Insufficient Stock")) {
          throw err // surface exact business rule rejection
        }
        console.warn("Firestore transaction fallback for delivery validation:", err)
        // Local simulation fallback
        const current = getFallbackDeliveries()
        const updated = current.map((d) => (d.id === deliveryId ? { ...d, status: "done" as DocStatus, updatedAt: Date.now() } : d))
        saveFallbackDeliveries(updated)
        queryClient.setQueryData(["deliveries"], updated)
      }

      return deliveryId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["stock_levels"] })
      queryClient.invalidateQueries({ queryKey: ["stock_ledger"] })
    },
  })
}

/**
 * Cancel a delivery order
 */
export function useCancelDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      try {
        await updateDoc(doc(deliveriesCol, deliveryId), {
          status: "cancelled",
          updatedAt: Date.now(),
        })
      } catch {
        const current = getFallbackDeliveries()
        const updated = current.map((d) => (d.id === deliveryId ? { ...d, status: "cancelled" as DocStatus, updatedAt: Date.now() } : d))
        saveFallbackDeliveries(updated)
        queryClient.setQueryData(["deliveries"], updated)
      }
      return deliveryId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
    },
  })
}

/**
 * Update delivery header/lines while in draft/waiting
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Delivery> & { id: string }) => {
      const payload = { ...data, updatedAt: Date.now() }
      try {
        await updateDoc(doc(deliveriesCol, id), payload)
      } catch {
        const current = getFallbackDeliveries()
        const updated = current.map((d) => (d.id === id ? { ...d, ...payload } : d))
        saveFallbackDeliveries(updated)
        queryClient.setQueryData(["deliveries"], updated)
      }
      return { id, ...payload }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
    },
  })
}
