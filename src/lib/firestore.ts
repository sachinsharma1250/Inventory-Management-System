import {
  collection,
  CollectionReference,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  doc,
  DocumentReference,
} from "firebase/firestore"
import { db } from "./firebase"
import type {
  Warehouse,
  Location,
  Product,
  ProductCategory,
  StockLevel,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  StockLedgerEntry,
  UserProfile,
} from "@/types"

/**
 * Generic Firestore Data Converter to ensure full TypeScript typing
 */
export const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    // Strip id if present to avoid duplicating the document ID field inside data
    const { id, ...rest } = data as Record<string, any>
    return rest
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): T => {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      ...data,
    } as T
  },
})

/**
 * Helper to construct strongly-typed Firestore collections
 */
export const typedCollection = <T extends DocumentData>(collectionPath: string): CollectionReference<T> => {
  return collection(db, collectionPath).withConverter(createConverter<T>())
}

/**
 * Helper to construct strongly-typed Firestore document references
 */
export const typedDoc = <T extends DocumentData>(collectionPath: string, documentId: string): DocumentReference<T> => {
  return doc(db, collectionPath, documentId).withConverter(createConverter<T>())
}

/**
 * Strongly-Typed Collections for the StockSense Database
 */
export const warehousesCol = typedCollection<Warehouse>("warehouses")
export const locationsCol = typedCollection<Location>("locations")
export const productsCol = typedCollection<Product>("products")
export const categoriesCol = typedCollection<ProductCategory>("categories")
export const stockLevelsCol = typedCollection<StockLevel>("stock_levels")
export const receiptsCol = typedCollection<Receipt>("receipts")
export const deliveriesCol = typedCollection<Delivery>("deliveries")
export const transfersCol = typedCollection<Transfer>("transfers")
export const adjustmentsCol = typedCollection<Adjustment>("adjustments")
export const stockLedgerCol = typedCollection<StockLedgerEntry>("stock_ledger")
export const usersCol = typedCollection<UserProfile>("users")

export const StockSenseCollections = {
  warehouses: warehousesCol,
  locations: locationsCol,
  products: productsCol,
  categories: categoriesCol,
  stock_levels: stockLevelsCol,
  receipts: receiptsCol,
  deliveries: deliveriesCol,
  transfers: transfersCol,
  adjustments: adjustmentsCol,
  stock_ledger: stockLedgerCol,
  users: usersCol,
} as const
