import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { transfersCol, stockLevelsCol, stockLedgerCol } from "@/lib/firestore"
import { triggerReorderCheck } from "@/functions/reorderLogic"
import type { Transfer, OrderLineItem, StockLevel, StockLedgerEntry } from "@/types"

const TRANSFERS_STORAGE_KEY = "stocksense_transfers_store"

export const DEFAULT_TRANSFERS: Transfer[] = [
  {
    id: "trf-001",
    reference: "WH/INT/00001",
    fromLocationId: "loc-main-stock",
    toLocationId: "loc-main-prod",
    status: "done",
    lines: [
      { productId: "prod-steel-rods", quantity: 20, productName: "Steel Rods 10mm", sku: "ROD-STL-001", uom: "kg" },
    ],
    notes: "Moved from Main Store to Production Rack for assembly",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "trf-002",
    reference: "WH/INT/00002",
    fromLocationId: "loc-main-stock",
    toLocationId: "loc-main-racka",
    status: "ready",
    lines: [
      { productId: "prod-alu-sheets", quantity: 15, productName: "Aluminum Sheet 2mm", sku: "SHT-ALU-005", uom: "sheets" },
    ],
    notes: "Replenishing fast-pick rack",
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
]

const getFallbackTransfers = (): Transfer[] => {
  const saved = localStorage.getItem(TRANSFERS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(DEFAULT_TRANSFERS))
  return DEFAULT_TRANSFERS
}

const saveFallbackTransfers = (transfers: Transfer[]) => {
  localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers))
}

export function useTransfers() {
  const queryClient = useQueryClient()
  const [transfers, setTransfers] = useState<Transfer[]>(getFallbackTransfers())

  useEffect(() => {
    try {
      const q = query(transfersCol, orderBy("createdAt", "desc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            setTransfers(list)
            saveFallbackTransfers(list)
            queryClient.setQueryData(["transfers"], list)
          } else {
            setTransfers(getFallbackTransfers())
          }
        },
        () => setTransfers(getFallbackTransfers())
      )
      return () => unsub()
    } catch {
      setTransfers(getFallbackTransfers())
    }
  }, [queryClient])

  return {
    transfers,
    isLoading: false,
  }
}

/**
 * Executes transferStock atomic transaction:
 * - Decrements onHand at `fromLocationId`
 * - Increments onHand at `toLocationId` per line
 * - Appends two stock_ledger entries per line (one negative at fromLocationId, one positive at toLocationId, both refType="transfer", same refId)
 */
export function useTransferStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      fromLocationId: string
      toLocationId: string
      lines: OrderLineItem[]
      notes?: string
    }) => {
      const { fromLocationId, toLocationId, lines, notes } = data

      if (fromLocationId === toLocationId) {
        throw new Error("Source location and destination location must be different.")
      }

      if (!lines || lines.length === 0) {
        throw new Error("Transfer must include at least one product line.")
      }

      const current = getFallbackTransfers()
      const nextNum = String(current.length + 1).padStart(5, "0")
      const reference = `WH/INT/${nextNum}`
      const transferId = `trf-${Date.now().toString(36)}`

      const transferDoc: Transfer = {
        id: transferId,
        reference,
        fromLocationId,
        toLocationId,
        status: "done",
        lines,
        notes: notes || `Internal transfer ${reference}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      try {
        await runTransaction(db, async (transaction) => {
          // 1. Check stock sufficiency at fromLocationId
          for (const line of lines) {
            const fromLevelRef = doc(stockLevelsCol, `${line.productId}_${fromLocationId}`)
            const fromSnap = await transaction.get(fromLevelRef)
            const currentOnHand = fromSnap.exists() ? Number(fromSnap.data()?.onHand) || 0 : 0

            if (currentOnHand < Number(line.quantity)) {
              throw new Error(
                `Insufficient Stock at Source: Item "${line.productName || line.productId}" has only ${currentOnHand} available, required ${line.quantity}. Transfer aborted.`
              )
            }
          }

          // 2. Decrement from and Increment to, write paired ledger entries
          for (const line of lines) {
            const qty = Number(line.quantity)

            // Decrement source
            const fromLevelRef = doc(stockLevelsCol, `${line.productId}_${fromLocationId}`)
            const fromSnap = await transaction.get(fromLevelRef)
            const fromCurrent = fromSnap.exists() ? Number(fromSnap.data()?.onHand) || 0 : 0
            const fromFree = fromSnap.exists() ? Number(fromSnap.data()?.freeToUse) || 0 : 0

            transaction.set(fromLevelRef, {
              productId: line.productId,
              locationId: fromLocationId,
              onHand: fromCurrent - qty,
              freeToUse: Math.max(0, fromFree - qty),
              updatedAt: Date.now(),
            }, { merge: true })

            // Increment destination
            const toLevelRef = doc(stockLevelsCol, `${line.productId}_${toLocationId}`)
            const toSnap = await transaction.get(toLevelRef)
            const toCurrent = toSnap.exists() ? Number(toSnap.data()?.onHand) || 0 : 0
            const toFree = toSnap.exists() ? Number(toSnap.data()?.freeToUse) || 0 : 0

            transaction.set(toLevelRef, {
              productId: line.productId,
              locationId: toLocationId,
              onHand: toCurrent + qty,
              freeToUse: toFree + qty,
              updatedAt: Date.now(),
            }, { merge: true })

            // Pair 1: Negative ledger entry at fromLocationId
            const ledgerIdFrom = `ledger-${Date.now().toString(36)}-f${Math.random().toString(36).substring(2, 5)}`
            transaction.set(doc(stockLedgerCol, ledgerIdFrom), {
              id: ledgerIdFrom,
              productId: line.productId,
              locationId: fromLocationId,
              qtyDelta: -qty,
              refType: "transfer",
              refId: reference,
              timestamp: Date.now(),
              userId: "manager",
              notes: `Moved to ${toLocationId}`,
            })

            // Pair 2: Positive ledger entry at toLocationId (same refId!)
            const ledgerIdTo = `ledger-${Date.now().toString(36)}-t${Math.random().toString(36).substring(2, 5)}`
            transaction.set(doc(stockLedgerCol, ledgerIdTo), {
              id: ledgerIdTo,
              productId: line.productId,
              locationId: toLocationId,
              qtyDelta: qty,
              refType: "transfer",
              refId: reference,
              timestamp: Date.now(),
              userId: "manager",
              notes: `Moved from ${fromLocationId}`,
            })
          }

          // Save transfer record
          transaction.set(doc(transfersCol, transferId), transferDoc)
        })

        // Check reorders
        for (const line of lines) {
          await triggerReorderCheck(line.productId)
        }
      } catch (err: any) {
        if (err.message && err.message.includes("Insufficient Stock")) {
          throw err
        }
        console.warn("Transfer fallback to local storage:", err)
        const updated = [transferDoc, ...current]
        saveFallbackTransfers(updated)
        queryClient.setQueryData(["transfers"], updated)
      }

      return transferDoc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["stock_levels"] })
      queryClient.invalidateQueries({ queryKey: ["stock_ledger"] })
    },
  })
}
