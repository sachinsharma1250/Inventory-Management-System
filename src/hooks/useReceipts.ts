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
import { receiptsCol, stockLevelsCol, stockLedgerCol, typedDoc } from "@/lib/firestore"
import { triggerReorderCheck } from "@/functions/reorderLogic"
import type { Receipt, DocStatus, StockLevel, StockLedgerEntry } from "@/types"

const RECEIPTS_STORAGE_KEY = "stocksense_receipts_store"

export const DEFAULT_RECEIPTS: Receipt[] = [
  {
    id: "rcpt-001",
    reference: "WH/IN/00001",
    from: "Apex Steel Global",
    to: "loc-main-stock",
    contact: "sales@apexsteel.com",
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    status: "ready",
    lines: [
      { productId: "prod-steel-rods", quantity: 50, productName: "Steel Rods 10mm", sku: "ROD-STL-001", uom: "kg" },
      { productId: "prod-alu-sheets", quantity: 20, productName: "Aluminum Sheet 2mm", sku: "SHT-ALU-005", uom: "sheets" },
    ],
    notes: "Express freight delivery from Chicago manufacturing plant",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: "rcpt-002",
    reference: "WH/IN/00002",
    from: "Fastener Supply Co",
    to: "loc-main-stock",
    contact: "orders@fastenersupply.com",
    scheduledDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    status: "waiting",
    lines: [
      { productId: "prod-m8-bolts", quantity: 100, productName: "M8 Hex Bolts (100pk)", sku: "BLT-HEX-003", uom: "boxes" },
    ],
    notes: "Replenishment for low inventory stock",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "rcpt-003",
    reference: "WH/IN/00003",
    from: "Industrial Polymers Ltd",
    to: "loc-main-stock",
    contact: "support@polymers.io",
    scheduledDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    status: "done",
    lines: [
      { productId: "prod-shrink-wrap", quantity: 40, productName: "Heavy-Duty Shrink Wrap", sku: "WRP-PLT-004", uom: "rolls" },
    ],
    notes: "Received and Shelved",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
]

const getFallbackReceipts = (): Receipt[] => {
  const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(DEFAULT_RECEIPTS))
  return DEFAULT_RECEIPTS
}

const saveFallbackReceipts = (receipts: Receipt[]) => {
  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts))
}

export function useReceipts(searchQuery: string = "", statusFilter: string = "all") {
  const queryClient = useQueryClient()
  const [receipts, setReceipts] = useState<Receipt[]>(getFallbackReceipts())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    try {
      const q = query(receiptsCol, orderBy("createdAt", "desc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            setReceipts(list)
            saveFallbackReceipts(list)
            queryClient.setQueryData(["receipts"], list)
          } else {
            setReceipts(getFallbackReceipts())
          }
        },
        () => setReceipts(getFallbackReceipts())
      )
      return () => unsub()
    } catch {
      setReceipts(getFallbackReceipts())
    }
  }, [queryClient])

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contact.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [receipts, searchQuery, statusFilter])

  return {
    receipts: filtered,
    allReceipts: receipts,
    isLoading,
  }
}

export function useReceipt(id?: string) {
  const { allReceipts } = useReceipts()
  return allReceipts.find((r) => r.id === id) || null
}

/**
 * Create a new Receipt with auto-generated reference (e.g. WH/IN/00004)
 */
export function useCreateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Receipt, "id" | "reference" | "status" | "createdAt" | "updatedAt">) => {
      const current = getFallbackReceipts()
      const nextNum = String(current.length + 1).padStart(5, "0")
      const reference = `WH/IN/${nextNum}`
      const id = `rcpt-${Date.now().toString(36)}`

      const newReceipt: Receipt = {
        ...data,
        id,
        reference,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        await setDoc(doc(receiptsCol, id), newReceipt)
      } catch {
        const updated = [newReceipt, ...current]
        saveFallbackReceipts(updated)
        queryClient.setQueryData(["receipts"], updated)
      }

      return newReceipt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
    },
  })
}

/**
 * Validate a receipt atomically using a single Firestore transaction:
 * - Moves status Draft -> Ready -> Done
 * - Increments stock_levels.onHand at destination location per line
 * - Appends one stock_ledger entry per line (refType="receipt", qtyDelta=+quantity)
 */
export function useValidateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (receiptId: string) => {
      const receiptRef = doc(receiptsCol, receiptId)

      try {
        await runTransaction(db, async (transaction) => {
          const receiptSnap = await transaction.get(receiptRef)
          if (!receiptSnap.exists()) {
            throw new Error(`Receipt ${receiptId} not found`)
          }

          const receipt = receiptSnap.data() as Receipt
          if (receipt.status === "done") {
            throw new Error("Receipt is already validated")
          }

          // Destination location
          const toLocationId = receipt.to || "loc-main-stock"

          // Increment stock_levels for each line & record ledger
          for (const line of receipt.lines) {
            const levelDocId = `${line.productId}_${toLocationId}`
            const levelRef = doc(stockLevelsCol, levelDocId)
            const levelSnap = await transaction.get(levelRef)

            const currentOnHand = levelSnap.exists() ? Number(levelSnap.data()?.onHand) || 0 : 0
            const currentFree = levelSnap.exists() ? Number(levelSnap.data()?.freeToUse) || 0 : 0
            const newOnHand = currentOnHand + Number(line.quantity)
            const newFree = currentFree + Number(line.quantity)

            transaction.set(levelRef, {
              productId: line.productId,
              locationId: toLocationId,
              onHand: newOnHand,
              freeToUse: newFree,
              updatedAt: Date.now(),
            }, { merge: true })

            // Ledger entry
            const ledgerId = `ledger-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
            const ledgerRef = doc(stockLedgerCol, ledgerId)
            transaction.set(ledgerRef, {
              id: ledgerId,
              productId: line.productId,
              locationId: toLocationId,
              qtyDelta: Number(line.quantity),
              refType: "receipt",
              refId: receipt.reference,
              timestamp: Date.now(),
              userId: "manager",
              notes: `Received from ${receipt.from}`,
            })
          }

          // Mark receipt as done
          transaction.update(receiptRef, {
            status: "done",
            updatedAt: Date.now(),
          })
        })

        // Recheck reorder thresholds
        const snap = await getDoc(receiptRef)
        if (snap.exists()) {
          for (const line of snap.data().lines) {
            await triggerReorderCheck(line.productId)
          }
        }
      } catch (err) {
        console.warn("Firestore transaction fallback to local storage:", err)
        // Local simulation fallback
        const current = getFallbackReceipts()
        const updated = current.map((r) => (r.id === receiptId ? { ...r, status: "done" as DocStatus, updatedAt: Date.now() } : r))
        saveFallbackReceipts(updated)
        queryClient.setQueryData(["receipts"], updated)
      }

      return receiptId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["stock_levels"] })
      queryClient.invalidateQueries({ queryKey: ["stock_ledger"] })
    },
  })
}

/**
 * Cancel a receipt (status = cancelled, no stock effect)
 */
export function useCancelReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (receiptId: string) => {
      try {
        const ref = doc(receiptsCol, receiptId)
        await updateDoc(ref, {
          status: "cancelled",
          updatedAt: Date.now(),
        })
      } catch {
        const current = getFallbackReceipts()
        const updated = current.map((r) => (r.id === receiptId ? { ...r, status: "cancelled" as DocStatus, updatedAt: Date.now() } : r))
        saveFallbackReceipts(updated)
        queryClient.setQueryData(["receipts"], updated)
      }
      return receiptId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
    },
  })
}

/**
 * Update receipt lines / header while draft
 */
export function useUpdateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Receipt> & { id: string }) => {
      const payload = { ...data, updatedAt: Date.now() }
      try {
        await updateDoc(doc(receiptsCol, id), payload)
      } catch {
        const current = getFallbackReceipts()
        const updated = current.map((r) => (r.id === id ? { ...r, ...payload } : r))
        saveFallbackReceipts(updated)
        queryClient.setQueryData(["receipts"], updated)
      }
      return { id, ...payload }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
    },
  })
}
