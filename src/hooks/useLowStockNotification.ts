import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Hook to manage browser Notifications for real-time low-stock alerts.
 *
 * - Automatically requests browser Notification permission on initial mount.
 * - Tracks lowStockCount and fires a notification whenever it increases.
 * - Clicking the notification navigates to `/products?filter=low-stock`.
 */
export function useLowStockNotification(lowStockCount: number) {
  const navigate = useNavigate()
  const prevCountRef = useRef<number | null>(null)
  const isInitialMount = useRef<boolean>(true)
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied"
  })

  // Request browser notification permission on first dashboard load
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied"
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (err) {
      console.warn("Notification permission request failed:", err)
      return "denied"
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        requestPermission()
      } else {
        setPermission(Notification.permission)
      }
    }
  }, [requestPermission])

  // Fire notification when low-stock count increases
  useEffect(() => {
    // On the initial load, store the current count without firing a redundant alert
    if (isInitialMount.current) {
      prevCountRef.current = lowStockCount
      isInitialMount.current = false
      return
    }

    const previousCount = prevCountRef.current

    if (previousCount !== null && lowStockCount > previousCount) {
      const delta = lowStockCount - previousCount

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const notification = new Notification("⚠️ StockSense: Low Stock Alert", {
            body: `${delta} new product${delta > 1 ? "s" : ""} dropped to low or zero stock (${lowStockCount} total). Click to inspect inventory.`,
            icon: "/favicon.svg",
            tag: "stocksense-low-stock-alert",
          })

          notification.onclick = () => {
            window.focus()
            navigate("/products?filter=low-stock")
            notification.close()
          }
        } catch (e) {
          console.warn("Could not dispatch browser notification:", e)
        }
      }
    }

    prevCountRef.current = lowStockCount
  }, [lowStockCount, navigate])

  return {
    permission,
    requestPermission,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  }
}
