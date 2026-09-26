import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Package,
  Layers,
  History,
} from "lucide-react"
import { useTransferStock } from "@/hooks/useTransfers"
import { useLocations } from "@/hooks/useLocations"
import { useProducts } from "@/hooks/useProducts"
import { useStock } from "@/hooks/useStock"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OrderLineItem } from "@/types"

export const NewTransferPage: React.FC = () => {
  const navigate = useNavigate()
  const transferMutation = useTransferStock()
  const { locations } = useLocations()
  const { allProducts } = useProducts()
  const { allStock } = useStock()

  const [fromLocId, setFromLocId] = useState(locations[0]?.id || "loc-main-stock")
  const [toLocId, setToLocId] = useState(locations[1]?.id || "loc-main-prod")
  const [notes, setNotes] = useState("")

  const [lines, setLines] = useState<OrderLineItem[]>([
    {
      productId: "prod-steel-rods",
      quantity: 10,
      productName: "Steel Rods 10mm",
      sku: "ROD-STL-001",
      uom: "kg",
    },
  ])

  // New line draft
  const [selectedProductId, setSelectedProductId] = useState(allProducts[0]?.id || "prod-steel-rods")
  const [lineQty, setLineQty] = useState("10")
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)

  const isSameLocation = fromLocId === toLocId

  const getSourceStock = (productId: string) => {
    const row = allStock.find((s) => s.productId === productId && s.locationId === fromLocId)
    return row ? row.onHand : 0
  }

  const handleAddLine = () => {
    const prod = allProducts.find((p) => p.id === selectedProductId)
    if (!prod) return
    const qty = Number(lineQty) || 1

    const existingIndex = lines.findIndex((l) => l.productId === selectedProductId)
    if (existingIndex >= 0) {
      setLines(
        lines.map((l, i) => (i === existingIndex ? { ...l, quantity: l.quantity + qty } : l))
      )
    } else {
      setLines([
        ...lines,
        {
          productId: prod.id,
          quantity: qty,
          productName: prod.name,
          sku: prod.sku,
          uom: prod.uom,
        },
      ])
    }
  }

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx))
  }

  const handleUpdateLineQty = (idx: number, newQty: number) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, newQty) } : l)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)
    setSuccessRef(null)

    if (isSameLocation) {
      setErrorBanner("Source and Destination locations must be different.")
      return
    }

    if (lines.length === 0) {
      setErrorBanner("Please add at least one product item to transfer.")
      return
    }

    try {
      const result = await transferMutation.mutateAsync({
        fromLocationId: fromLocId,
        toLocationId: toLocId,
        lines,
        notes: notes || "Internal stock reallocation",
      })

      setSuccessRef(result.reference)
    } catch (err: any) {
      setErrorBanner(err.message || "Transfer failed to execute.")
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">New Internal Transfer</h1>
              <p className="text-xs text-zinc-400">
                Move stock between warehouse racks, production floors, and staging zones
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
      {successRef && (
        <Card className="border-emerald-700 bg-emerald-950/40 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="font-bold text-emerald-100 text-sm">
                  Transfer Executed: <span className="font-mono text-white">{successRef}</span>
                </p>
                <p className="text-xs text-emerald-300/80">
                  Stock was decremented from source and incremented at destination. Paired entries logged in the Stock Ledger.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/move-history")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
            >
              View in Ledger <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/50 p-4 text-xs text-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-100">Transfer Aborted</p>
            <p className="text-red-300/90">{errorBanner}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Locations Routing Card */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Routing Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                From Location (Source)
              </Label>
              <select
                value={fromLocId}
                onChange={(e) => setFromLocId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#FF5A36]" />
                To Location (Destination)
              </Label>
              <select
                value={toLocId}
                onChange={(e) => setToLocId(e.target.value)}
                className={`w-full rounded-md border bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none ${
                  isSameLocation ? "border-red-600" : "border-zinc-800 focus:border-[#FF5A36]"
                }`}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </select>
              {isSameLocation && (
                <p className="text-[11px] text-red-400">
                  Destination cannot be identical to source location.
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label className="text-xs text-zinc-400">Transfer Reason / Operator Notes</Label>
              <Input
                placeholder="e.g. Relocating steel rods to production floor for cutting assembly"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Product Items Table */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/80 pb-3">
            <CardTitle className="text-base text-zinc-100 flex items-center justify-between">
              <span>Items to Transfer</span>
              <Badge variant="outline" className="font-mono text-zinc-400 text-xs">
                {lines.length} Line{lines.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300 font-semibold">Product</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">SKU</TableHead>
                  <TableHead className="text-zinc-300 font-semibold text-right">Available at Source</TableHead>
                  <TableHead className="text-zinc-300 font-semibold text-right">Transfer Qty</TableHead>
                  <TableHead className="text-right text-zinc-300">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                      No items staged for transfer.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line, idx) => {
                    const available = getSourceStock(line.productId)
                    const hasShortage = available < line.quantity
                    return (
                      <TableRow key={`${line.productId}_${idx}`} className="border-zinc-800/60">
                        <TableCell className="font-semibold text-zinc-200">
                          {line.productName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {line.sku}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className={hasShortage ? "text-red-400 font-bold" : "text-zinc-300"}>
                            {available} {line.uom}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLineQty(idx, Number(e.target.value) || 1)}
                            className="w-24 text-right bg-zinc-900 border-zinc-800 text-white font-mono text-xs ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLine(idx)}
                            className="h-7 w-7 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Inline Add Line */}
            <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-28">
                <Input
                  type="number"
                  min="1"
                  value={lineQty}
                  onChange={(e) => setLineQty(e.target.value)}
                  placeholder="Qty"
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs h-9"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddLine}
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white text-xs gap-1.5 h-9 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-[#FF5A36]" />
                Add Item
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
            <Button
              type="submit"
              disabled={transferMutation.isPending || isSameLocation || lines.length === 0}
              className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs gap-2 font-semibold shadow-lg shadow-[#FF5A36]/25 disabled:opacity-40"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {transferMutation.isPending ? "Committing Transfer..." : "Validate & Execute Transfer"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default NewTransferPage
