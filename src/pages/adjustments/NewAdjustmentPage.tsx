import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  History,
  Building2,
  MapPin,
  Package,
  Layers,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Info,
} from "lucide-react"
import { useAdjustStock } from "@/hooks/useAdjustments"
import { useProducts } from "@/hooks/useProducts"
import { useLocations } from "@/hooks/useLocations"
import { useStock } from "@/hooks/useStock"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const NewAdjustmentPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramProductId = searchParams.get("productId")
  const paramLocationId = searchParams.get("locationId")

  const { allProducts } = useProducts()
  const { locations } = useLocations()
  const { allStock } = useStock()
  const adjustMutation = useAdjustStock()

  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [countedQtyInput, setCountedQtyInput] = useState<string>("")
  const [reason, setReason] = useState<string>("Physical stock audit count")
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{
    reference: string
    delta: number
    countedQty: number
  } | null>(null)

  // Initialize selected product and location from params or defaults
  useEffect(() => {
    if (allProducts.length > 0 && !selectedProductId) {
      if (paramProductId && allProducts.some((p) => p.id === paramProductId)) {
        setSelectedProductId(paramProductId)
      } else {
        setSelectedProductId(allProducts[0].id)
      }
    }
  }, [allProducts, paramProductId, selectedProductId])

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      if (paramLocationId && locations.some((l) => l.id === paramLocationId)) {
        setSelectedLocationId(paramLocationId)
      } else {
        setSelectedLocationId(locations[0].id)
      }
    }
  }, [locations, paramLocationId, selectedLocationId])

  const selectedProduct = allProducts.find((p) => p.id === selectedProductId)
  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  // Find recorded stock in stock_levels
  const recordedStockLevel = allStock.find(
    (s) => s.productId === selectedProductId && s.locationId === selectedLocationId
  )
  const recordedQty = recordedStockLevel ? recordedStockLevel.onHand : 0

  // Set default counted qty when product or location changes, if not edited
  useEffect(() => {
    if (recordedStockLevel !== undefined) {
      setCountedQtyInput(String(recordedQty))
    }
  }, [selectedProductId, selectedLocationId, recordedQty])

  const countedQty = countedQtyInput === "" ? 0 : Number(countedQtyInput)
  const delta = countedQty - recordedQty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)
    setSuccessResult(null)

    if (!selectedProductId) {
      setErrorBanner("Please select a product to adjust.")
      return
    }
    if (!selectedLocationId) {
      setErrorBanner("Please select a location.")
      return
    }
    if (isNaN(countedQty) || countedQty < 0) {
      setErrorBanner("Counted quantity must be a valid non-negative number.")
      return
    }

    try {
      const res = await adjustMutation.mutateAsync({
        productId: selectedProductId,
        locationId: selectedLocationId,
        countedQty,
        reason: reason.trim() || "Physical inventory count adjustment",
      })

      setSuccessResult(res)
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to record stock adjustment.")
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Stock Adjustment</h1>
              <p className="text-xs text-zinc-400">
                Reconcile physical stock counts against system records (damaged, lost, or found items)
              </p>
            </div>
          </div>
        </div>

        <Link to="/move-history">
          <Button variant="outline" size="sm" className="border-zinc-800 text-xs gap-1.5 text-zinc-300">
            <History className="h-3.5 w-3.5 text-[#FF5A36]" />
            Move History
          </Button>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successResult && (
        <Card className="border-emerald-700 bg-emerald-950/40 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-100 text-sm">
                  Adjustment Applied: <span className="font-mono text-white">{successResult.reference}</span>
                </p>
                <p className="text-xs text-emerald-300/80">
                  Stock set to <strong>{successResult.countedQty}</strong> units. Delta of{" "}
                  <strong>{successResult.delta >= 0 ? `+${successResult.delta}` : successResult.delta}</strong>{" "}
                  logged to the Stock Ledger.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSuccessResult(null)}
                className="border-emerald-800 text-emerald-300 text-xs"
              >
                Adjust Another
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/move-history")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
              >
                View Ledger <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/50 p-4 text-xs text-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-100">Adjustment Aborted</p>
            <p className="text-red-300/90">{errorBanner}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border-zinc-800 bg-zinc-950/90 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <CardTitle className="text-base text-zinc-100">
              Inventory Reconciliation Parameters
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Selecting product and location will load live recorded stock from Firestore
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Product & Location Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Picker */}
              <div className="space-y-2">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-[#FF5A36]" />
                  Product Master
                </Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.uom}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                    <span>SKU: <code className="text-zinc-300 font-mono">{selectedProduct.sku}</code></span>
                    <span>•</span>
                    <span>UoM: <strong className="text-zinc-300">{selectedProduct.uom}</strong></span>
                  </div>
                )}
              </div>

              {/* Location Picker */}
              <div className="space-y-2">
                <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  Target Location
                </Label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.shortCode})
                    </option>
                  ))}
                </select>
                {selectedLocation && (
                  <p className="pt-1 text-[11px] text-zinc-400">
                    Location Code: <code className="text-zinc-300 font-mono">{selectedLocation.shortCode}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Live Count Reconciler Box */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* 1. Read-only Current Recorded Stock */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400 flex items-center justify-between">
                    <span>Current Recorded Stock (System)</span>
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-[10px]">
                      Live Firestore
                    </Badge>
                  </Label>
                  <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-zinc-300">
                    <span className="font-mono text-lg font-bold text-white mr-2">{recordedQty}</span>
                    <span className="text-xs text-zinc-400">{selectedProduct?.uom || "units"}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Sum of on-hand units in current location
                  </p>
                </div>

                {/* 2. Editable Counted Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-200 flex items-center justify-between">
                    <span className="font-semibold text-white">Physical Counted Quantity</span>
                    <span className="text-[10px] text-[#FF5A36] font-medium">* Editable</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={countedQtyInput}
                      onChange={(e) => setCountedQtyInput(e.target.value)}
                      placeholder="Enter actual physical count"
                      className="bg-zinc-900 border-zinc-700 text-white font-mono text-lg font-bold focus:border-[#FF5A36] pr-14"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                      {selectedProduct?.uom || "units"}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Actual physical stock verified on the warehouse floor
                  </p>
                </div>
              </div>

              {/* 3. Live-computed Delta Display */}
              <div className="pt-3 border-t border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    {delta < 0 ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                    ) : delta > 0 ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <Info className="h-4 w-4" />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-zinc-300">
                        Computed Difference (Delta)
                      </p>
                      <p className="text-xs">
                        {delta === 0 ? (
                          <span className="text-zinc-400 font-mono">0 {selectedProduct?.uom} (Stock matches records)</span>
                        ) : delta < 0 ? (
                          <span className="text-rose-400 font-medium font-mono">
                            {delta} {selectedProduct?.uom}, will log as a decrease / loss
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium font-mono">
                            +{delta} {selectedProduct?.uom}, will log as an increase / found stock
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`font-mono text-xs px-2.5 py-1 ${
                      delta < 0
                        ? "border-rose-800 bg-rose-950/50 text-rose-300"
                        : delta > 0
                        ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    Delta: {delta >= 0 ? `+${delta}` : delta}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Reason / Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Adjustment Justification / Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Physical inventory count, damaged goods write-off, cycle count variance"
                className="bg-zinc-900 border-zinc-800 text-white text-xs"
              />
            </div>
          </CardContent>

          <CardFooter className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
            <Link to="/stock">
              <Button type="button" variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={adjustMutation.isPending || delta === 0}
              className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs font-semibold gap-2 shadow-lg shadow-[#FF5A36]/25 disabled:opacity-40"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {adjustMutation.isPending ? "Applying Adjustment..." : "Validate & Apply Adjustment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default NewAdjustmentPage
