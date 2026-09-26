import {
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  doc,
} from "firebase/firestore"
import {
  productsCol,
  stockLevelsCol,
  receiptsCol,
  typedDoc,
} from "@/lib/firestore"
import type { Product, Receipt } from "@/types"

/**
 * Reorder logic triggered whenever stock_levels are written.
 *
 * When total onHand <= reorderPoint:
 * 1. Sets lowStock = true on the product document.
 * 2. Checks if an active Draft receipt already exists for that product.
 * 3. If none exists, creates an automated Draft Receipt for replenishment.
 *
 * If onHand > reorderPoint:
 * 1. Resets lowStock = false on the product document.
 */
export async function triggerReorderCheck(productId: string, defaultLocationId: string = "loc-main-stock"): Promise<{
  triggered: boolean
  receiptCreated?: string
  lowStock: boolean
}> {
  try {
    const prodRef = typedDoc<Product>("products", productId)
    const prodSnap = await getDoc(prodRef)

    if (!prodSnap.exists()) {
      return { triggered: false, lowStock: false }
    }

    const product = prodSnap.data()
    const reorderPoint = Number(product.reorderPoint) || 0

    // Sum all onHand for this product across all stock_levels
    const qLevels = query(stockLevelsCol, where("productId", "==", productId))
    const levelsSnap = await getDocs(qLevels)
    const totalOnHand = levelsSnap.docs.reduce((sum, d) => sum + (Number(d.data().onHand) || 0), 0)

    const isLow = totalOnHand <= reorderPoint

    // Update product.lowStock
    await updateDoc(prodRef, {
      lowStock: isLow,
      updatedAt: Date.now(),
    })

    if (isLow) {
      // Check if an open/draft receipt already exists containing this product
      const qReceipts = query(receiptsCol, where("status", "in", ["draft", "waiting"]))
      const receiptsSnap = await getDocs(qReceipts)
      const existingReceipt = receiptsSnap.docs.find((d) =>
        d.data().lines?.some((line) => line.productId === productId)
      )

      if (!existingReceipt) {
        // Create an automated replenishment Draft Receipt
        const receiptId = `rcpt-reorder-${Date.now().toString(36)}`
        const autoRef = `WH/IN/AUTO-${Math.floor(1000 + Math.random() * 9000)}`
        const reorderQuantity = Math.max(25, reorderPoint * 2)

        const newReceipt: Receipt = {
          id: receiptId,
          reference: autoRef,
          from: "Automated Reorder System",
          to: defaultLocationId,
          contact: "Procurement Dispatch",
          scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
          status: "draft",
          lines: [
            {
              productId: product.id,
              quantity: reorderQuantity,
              productName: product.name,
              sku: product.sku,
              uom: product.uom,
            },
          ],
          notes: `Automated replenishment triggered: On-hand (${totalOnHand}) <= Reorder Point (${reorderPoint})`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        const newReceiptRef = doc(receiptsCol, receiptId)
        await setDoc(newReceiptRef, newReceipt)

        return {
          triggered: true,
          receiptCreated: autoRef,
          lowStock: true,
        }
      }

      return { triggered: false, lowStock: true }
    }

    return { triggered: false, lowStock: false }
  } catch (err) {
    console.warn("Reorder logic trigger evaluation error (safe fallback):", err)
    return { triggered: false, lowStock: false }
  }
}
