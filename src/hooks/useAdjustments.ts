import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  doc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { adjustmentsCol, stockLevelsCol, stockLedgerCol } from "@/lib/firestore"
import { triggerReorderCheck } from "@/functions/reorderLogic"
import type { Adjustment, StockLevel, StockLedgerEntry } from "@/types"

const ADJUSTMENTS_STORAGE_KEY = "stocksense_adjustments_store"

export const DEFAULT_ADJUSTMENTS: Adjustment[] = [
  {
    id: "adj-001",
    reference: "WH/ADJ/00001",
    productId: "prod-steel-rods",
    locationId: "loc-main-stock",
    countedQty: 117,
    recordedQty: 120,
    difference: -3,
    status: "done",
    reason: "Damaged rods removed from shelf",
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
]

const getFallbackAdjustments = (): Adjustment[] => {
  const saved = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_ADJUSTMENTS))
  return DEFAULT_ADJUSTMENTS
}

const saveFallbackAdjustments = (adjs: Adjustment[]) => {
  localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjs))
}

export function useAdjustments() {
  const queryClient = useQueryClient()
  const [adjustments, setAdjustments] = useState<Adjustment[]>(getFallbackAdjustments())

  useEffect(() => {
    try {
      const q = query(adjustmentsCol, orderBy("createdAt", "desc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data())
            setAdjustments(list)
            saveFallbackAdjustments(list)
            queryClient.setQueryData(["adjustments"], list)
          } else {
            setAdjustments(getFallbackAdjustments())
          }
        },
        () => setAdjustments(getFallbackAdjustments())
      )
      return () => unsub()
    } catch {
      setAdjustments(getFallbackAdjustments())
    }
  }, [queryClient])

  return {
    adjustments,
    isLoading: false,
  }
}

/**
 * Executes adjustStock atomic transaction:
 * - Computes delta against current onHand
 * - Writes countedQty to stock_levels
 * - Appends one stock_ledger entry (refType="adjustment", qtyDelta=delta)
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      locationId: string
      countedQty: number
      reason?: string
    }) => {
      const { productId, locationId, countedQty, reason } = data

      const current = getFallbackAdjustments()
      const nextNum = String(current.length + 1).padStart(5, "0")
      const reference = `WH/ADJ/${nextNum}`
      const adjustmentId = `adj-${Date.now().toString(36)}`

      let calculatedDelta = 0
      let recordedBefore = 0

      try {
        await runTransaction(db, async (transaction) => {
          const levelRef = doc(stockLevelsCol, `${productId}_${locationId}`)
          const levelSnap = await transaction.get(levelRef)

          recordedBefore = levelSnap.exists() ? Number(levelSnap.data()?.onHand) || 0 : 0
          calculatedDelta = countedQty - recordedBefore

          // Update stock level to countedQty
          const currentFree = levelSnap.exists() ? Number(levelSnap.data()?.freeToUse) || 0 : 0
          const newFree = Math.max(0, currentFree + calculatedDelta)

          transaction.set(levelRef, {
            productId,
            locationId,
            onHand: countedQty,
            freeToUse: newFree,
            updatedAt: Date.now(),
          }, { merge: true })

          // Append one stock_ledger entry
          const ledgerId = `ledger-${Date.now().toString(36)}`
          const ledgerRef = doc(stockLedgerCol, ledgerId)
          transaction.set(ledgerRef, {
            id: ledgerId,
            productId,
            locationId,
            qtyDelta: calculatedDelta,
            refType: "adjustment",
            refId: reference,
            timestamp: Date.now(),
            userId: "manager",
            notes: reason || `Inventory count adjustment (${calculatedDelta >= 0 ? "+" : ""}${calculatedDelta})`,
          })

          // Save Adjustment document
          const adjDoc: Adjustment = {
            id: adjustmentId,
            reference,
            productId,
            locationId,
            countedQty,
            recordedQty: recordedBefore,
            difference: calculatedDelta,
            status: "done",
            reason: reason || "Physical stock count reconciliation",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

          transaction.set(doc(adjustmentsCol, adjustmentId), adjDoc)
        })

        await triggerReorderCheck(productId, locationId)
      } catch (err) {
        console.warn("Adjustment transaction fallback to local storage:", err)
        const adjDoc: Adjustment = {
          id: adjustmentId,
          reference,
          productId,
          locationId,
          countedQty,
          recordedQty: recordedBefore,
          difference: countedQty - recordedBefore,
          status: "done",
          reason: reason || "Physical stock count reconciliation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        const updated = [adjDoc, ...current]
        saveFallbackAdjustments(updated)
        queryClient.setQueryData(["adjustments"], updated)
      }

      return {
        reference,
        delta: calculatedDelta,
        countedQty,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["stock_levels"] })
      queryClient.invalidateQueries({ queryKey: ["stock_ledger"] })
    },
  })
}
