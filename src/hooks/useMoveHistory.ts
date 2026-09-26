import { useEffect, useState, useMemo } from "react"
import { onSnapshot, query, orderBy } from "firebase/firestore"
import Papa from "papaparse"
import {
  stockLedgerCol,
  productsCol,
  locationsCol,
  receiptsCol,
  deliveriesCol,
  transfersCol,
  adjustmentsCol,
} from "@/lib/firestore"
import { DEFAULT_PRODUCTS } from "./useProducts"
import { DEFAULT_RECEIPTS } from "./useReceipts"
import { DEFAULT_DELIVERIES } from "./useDeliveries"
import { DEFAULT_TRANSFERS } from "./useTransfers"
import { DEFAULT_ADJUSTMENTS } from "./useAdjustments"
import type {
  StockLedgerEntry,
  Product,
  Location,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  DocTypeFilter,
  StatusFilter,
} from "@/types"

export interface MoveHistoryRow {
  id: string
  reference: string
  contact: string
  productName: string
  productId: string
  categoryId: string
  from: string
  to: string
  locationId: string
  warehouseId: string
  quantity: number
  status: string
  refType: string
  timestamp: number
  formattedDate: string
  notes?: string
}

const STOCK_LEDGER_STORAGE_KEY = "stocksense_ledger_store"

const DEFAULT_LEDGER_ENTRIES: StockLedgerEntry[] = [
  {
    id: "leg-001",
    productId: "prod-steel-rods",
    locationId: "loc-main-stock",
    qtyDelta: 50,
    refType: "receipt",
    refId: "WH/IN/00001",
    timestamp: Date.now() - 86400000 * 2,
    userId: "manager",
    notes: "Vendor delivery received",
  },
  {
    id: "leg-002",
    productId: "prod-steel-rods",
    locationId: "loc-main-stock",
    qtyDelta: -20,
    refType: "transfer",
    refId: "WH/INT/00001",
    timestamp: Date.now() - 86400000 * 1.5,
    userId: "manager",
    notes: "Transferred to Production Floor",
  },
  {
    id: "leg-003",
    productId: "prod-steel-rods",
    locationId: "loc-main-prod",
    qtyDelta: 20,
    refType: "transfer",
    refId: "WH/INT/00001",
    timestamp: Date.now() - 86400000 * 1.5,
    userId: "manager",
    notes: "Transferred from Main Store",
  },
  {
    id: "leg-004",
    productId: "prod-ind-chairs",
    locationId: "loc-main-stock",
    qtyDelta: -15,
    refType: "delivery",
    refId: "WH/OUT/00003",
    timestamp: Date.now() - 86400000 * 1,
    userId: "manager",
    notes: "Shipped to Chicago Tech Park",
  },
  {
    id: "leg-005",
    productId: "prod-steel-rods",
    locationId: "loc-main-stock",
    qtyDelta: -3,
    refType: "adjustment",
    refId: "WH/ADJ/00001",
    timestamp: Date.now() - 86400000 * 0.5,
    userId: "manager",
    notes: "Damaged items write-off",
  },
]

const getFallbackLedger = (): StockLedgerEntry[] => {
  const saved = localStorage.getItem(STOCK_LEDGER_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {}
  }
  localStorage.setItem(STOCK_LEDGER_STORAGE_KEY, JSON.stringify(DEFAULT_LEDGER_ENTRIES))
  return DEFAULT_LEDGER_ENTRIES
}

export interface MoveHistoryFilterOptions {
  searchQuery?: string
  docType?: DocTypeFilter
  status?: StatusFilter
  warehouseId?: string
  categoryId?: string
  startDate?: string
  endDate?: string
}

/**
 * Real-time, batched stream of stock_ledger entries resolved to:
 * Reference | Contact | Product | From | To | Quantity | Status
 */
export function useMoveHistory(filters: MoveHistoryFilterOptions = {}) {
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(getFallbackLedger())
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [locations, setLocations] = useState<Location[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>(DEFAULT_RECEIPTS)
  const [deliveries, setDeliveries] = useState<Delivery[]>(DEFAULT_DELIVERIES)
  const [transfers, setTransfers] = useState<Transfer[]>(DEFAULT_TRANSFERS)
  const [adjustments, setAdjustments] = useState<Adjustment[]>(DEFAULT_ADJUSTMENTS)

  useEffect(() => {
    const unsubs: (() => void)[] = []

    try {
      unsubs.push(
        onSnapshot(query(stockLedgerCol, orderBy("timestamp", "desc")), (snap) => {
          if (!snap.empty) {
            setLedger(snap.docs.map((d) => d.data()))
          }
        })
      )
      unsubs.push(
        onSnapshot(productsCol, (snap) => {
          if (!snap.empty) setProducts(snap.docs.map((d) => d.data()))
        })
      )
      unsubs.push(
        onSnapshot(locationsCol, (snap) => {
          if (!snap.empty) setLocations(snap.docs.map((d) => d.data()))
        })
      )
      unsubs.push(
        onSnapshot(receiptsCol, (snap) => {
          if (!snap.empty) setReceipts(snap.docs.map((d) => d.data()))
        })
      )
      unsubs.push(
        onSnapshot(deliveriesCol, (snap) => {
          if (!snap.empty) setDeliveries(snap.docs.map((d) => d.data()))
        })
      )
      unsubs.push(
        onSnapshot(transfersCol, (snap) => {
          if (!snap.empty) setTransfers(snap.docs.map((d) => d.data()))
        })
      )
      unsubs.push(
        onSnapshot(adjustmentsCol, (snap) => {
          if (!snap.empty) setAdjustments(snap.docs.map((d) => d.data()))
        })
      )
    } catch (e) {
      console.warn("MoveHistory live listener fallback:", e)
    }

    return () => {
      unsubs.forEach((u) => {
        try { u() } catch {}
      })
    }
  }, [])

  // Batched resolution: Map all related docs in O(1) memory lookup without N+1 reads!
  const resolvedRows: MoveHistoryRow[] = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.id, p]))
    const locMap = new Map(locations.map((l) => [l.id, l]))
    const rcptMap = new Map(receipts.map((r) => [r.reference, r]))
    const delMap = new Map(deliveries.map((d) => [d.reference, d]))
    const trfMap = new Map(transfers.map((t) => [t.reference, t]))
    const adjMap = new Map(adjustments.map((a) => [a.reference, a]))

    return ledger.map((entry) => {
      const prod = prodMap.get(entry.productId)
      const loc = locMap.get(entry.locationId)
      const locName = loc ? `${loc.name} (${loc.shortCode})` : entry.locationId

      let reference = entry.refId
      let contact = "Internal System"
      let from = locName
      let to = locName
      let status = "done"

      if (entry.refType === "receipt") {
        const rcpt = rcptMap.get(entry.refId)
        reference = entry.refId
        contact = rcpt?.contact || rcpt?.from || "Supplier"
        from = rcpt?.from || "Vendor Supplier"
        to = locName
        status = rcpt?.status || "done"
      } else if (entry.refType === "delivery") {
        const del = delMap.get(entry.refId)
        reference = entry.refId
        contact = del?.contact || del?.to || "Customer"
        from = locName
        to = del?.to || "Customer Shipping"
        status = del?.status || "done"
      } else if (entry.refType === "transfer") {
        const trf = trfMap.get(entry.refId)
        reference = entry.refId
        contact = "Warehouse Logistics"
        if (entry.qtyDelta < 0) {
          from = locName
          const targetLoc = trf ? locMap.get(trf.toLocationId) : null
          to = targetLoc ? `${targetLoc.name} (${targetLoc.shortCode})` : "Internal Rack"
        } else {
          const srcLoc = trf ? locMap.get(trf.fromLocationId) : null
          from = srcLoc ? `${srcLoc.name} (${srcLoc.shortCode})` : "Internal Rack"
          to = locName
        }
        status = trf?.status || "done"
      } else if (entry.refType === "adjustment") {
        const adj = adjMap.get(entry.refId)
        reference = entry.refId
        contact = "Inventory Count Auditor"
        from = locName
        to = entry.qtyDelta >= 0 ? "Found Stock Correction" : "Damage / Loss Write-Off"
        status = adj?.status || "done"
      }

      const ts = typeof entry.timestamp === "number" ? entry.timestamp : Date.now()

      return {
        id: entry.id,
        reference,
        contact,
        productName: prod ? prod.name : entry.productId,
        productId: entry.productId,
        categoryId: prod?.categoryId || "all",
        from,
        to,
        locationId: entry.locationId,
        warehouseId: loc?.warehouseId || "all",
        quantity: entry.qtyDelta,
        status,
        refType: entry.refType,
        timestamp: ts,
        formattedDate: new Date(ts).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        notes: entry.notes,
      }
    })
  }, [ledger, products, locations, receipts, deliveries, transfers, adjustments])

  // Apply filters
  const filteredRows = useMemo(() => {
    return resolvedRows.filter((row) => {
      // Document type filter
      if (filters.docType && filters.docType !== "all") {
        const targetType = filters.docType === "receipts"
          ? "receipt"
          : filters.docType === "deliveries"
          ? "delivery"
          : filters.docType === "transfers"
          ? "transfer"
          : filters.docType === "adjustments"
          ? "adjustment"
          : "all"

        if (targetType !== "all" && row.refType !== targetType) {
          return false
        }
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        if (row.status !== filters.status) return false
      }

      // Warehouse filter
      if (filters.warehouseId && filters.warehouseId !== "all") {
        if (row.warehouseId !== filters.warehouseId) return false
      }

      // Category filter
      if (filters.categoryId && filters.categoryId !== "all") {
        if (row.categoryId !== filters.categoryId) return false
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const matches =
          row.reference.toLowerCase().includes(q) ||
          row.productName.toLowerCase().includes(q) ||
          row.contact.toLowerCase().includes(q) ||
          row.from.toLowerCase().includes(q) ||
          row.to.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Date range filters
      if (filters.startDate) {
        const startTs = new Date(filters.startDate).getTime()
        if (row.timestamp < startTs) return false
      }
      if (filters.endDate) {
        const endTs = new Date(filters.endDate).getTime() + 86400000
        if (row.timestamp > endTs) return false
      }

      return true
    })
  }, [resolvedRows, filters])

  return {
    rows: filteredRows,
    totalCount: resolvedRows.length,
    isLoading: false,
  }
}

/**
 * CSV export utility using papaparse to trigger a browser download
 */
export function exportMoveHistoryToCsv(rows: MoveHistoryRow[]) {
  const exportData = rows.map((r) => ({
    Reference: r.reference,
    "Ref Type": r.refType.toUpperCase(),
    Contact: r.contact,
    Product: r.productName,
    "From Location": r.from,
    "To Location": r.to,
    Quantity: r.quantity > 0 ? `+${r.quantity}` : `${r.quantity}`,
    Status: r.status.toUpperCase(),
    Timestamp: new Date(r.timestamp).toISOString(),
    Notes: r.notes || "",
  }))

  const csv = Papa.unparse(exportData)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `stocksense_move_history_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
