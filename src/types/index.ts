/**
 * StockSense Core Shared Types & Contracts
 * 4-Person Hackathon Foundation
 */

export type DocStatus = "draft" | "waiting" | "ready" | "done" | "cancelled"

export type RefType = "receipt" | "delivery" | "transfer" | "adjustment"

export interface Warehouse {
  id: string
  name: string
  shortCode: string
  address: string
  createdAt?: string | number
}

export interface Location {
  id: string
  name: string
  shortCode: string
  warehouseId: string
  createdAt?: string | number
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  categoryId: string
  uom: string // e.g., 'units', 'kg', 'boxes', 'meters'
  reorderPoint: number
  costPerUnit: number
  barcode?: string
  initialStock?: number
  createdAt?: string | number
  updatedAt?: string | number
}

export interface StockLevel {
  productId: string
  locationId: string
  onHand: number
  freeToUse: number
  updatedAt?: string | number
}

export interface StockLedgerEntry {
  id: string
  productId: string
  locationId: string
  qtyDelta: number // positive for additions (receipts), negative for deductions (deliveries)
  refType: RefType
  refId: string
  timestamp: string | number
  userId: string
  notes?: string
}

export interface OrderLineItem {
  productId: string
  quantity: number
  productName?: string
  sku?: string
  uom?: string
}

export interface Receipt {
  id: string
  reference: string // e.g. WH/IN/00001
  from: string // Supplier / Vendor name or ID
  to: string // Destination Location or Warehouse ID
  contact: string
  scheduledDate: string
  status: DocStatus
  lines: OrderLineItem[]
  notes?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export interface Delivery {
  id: string
  reference: string // e.g. WH/OUT/00001
  from: string // Source Location or Warehouse ID
  to: string // Customer / Destination name or ID
  contact: string
  scheduledDate: string
  status: DocStatus
  lines: OrderLineItem[]
  notes?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export interface Transfer {
  id: string
  reference: string // e.g. WH/INT/00001
  fromLocationId: string
  toLocationId: string
  status: DocStatus
  lines: OrderLineItem[]
  notes?: string
  scheduledDate?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export interface Adjustment {
  id: string
  reference: string // e.g. WH/ADJ/00001
  productId: string
  locationId: string
  countedQty: number
  recordedQty?: number
  difference?: number
  status: DocStatus
  reason?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  role?: "manager" | "staff" | "admin"
  warehouseId?: string
  createdAt?: string | number
}

export interface DashboardKPIs {
  totalProductsInStock: number
  lowStockItemsCount: number
  outOfStockItemsCount: number
  pendingReceiptsCount: number
  pendingDeliveriesCount: number
  scheduledTransfersCount: number
}
