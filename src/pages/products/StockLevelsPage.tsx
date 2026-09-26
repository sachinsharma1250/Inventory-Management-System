import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Boxes,
  Search,
  Filter,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Barcode,
  Package,
} from "lucide-react"
import { useStock, type StockItemView } from "@/hooks/useStock"
import { useCategories } from "@/hooks/useProducts"
import { useWarehouses } from "@/hooks/useWarehouses"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

export const StockLevelsPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<StockItemView | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { stock, isLoading } = useStock(search, selectedCategory)
  const { categories } = useCategories()

  const handleRowClick = (item: StockItemView) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  const handleAdjustShortcut = () => {
    if (!selectedItem) return
    navigate(`/adjustments/new?productId=${selectedItem.productId}&locationId=${selectedItem.locationId}`)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Stock Availability</h1>
              <p className="text-xs text-zinc-400">
                Real-time on-hand inventory vs. allocated sales deliveries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/products")}
            variant="outline"
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-200"
          >
            Manage Products
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/transfers/new")}
            className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 text-xs"
          >
            Transfer Stock
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none h-9"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mockup-Style Stock Table */}
      <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/80 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#FF5A36]" />
              Stock Table
            </CardTitle>
            <span className="text-xs text-zinc-500">
              Click any row for quick actions & details
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-300 font-semibold">Product</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">per unit cost</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">On hand</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">free to Use</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    Loading stock records...
                  </TableCell>
                </TableRow>
              ) : stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    No matching stock items found.
                  </TableCell>
                </TableRow>
              ) : (
                stock.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-zinc-800/60 hover:bg-zinc-900/60 transition-colors group"
                  >
                    <TableCell onClick={() => handleRowClick(row)} className="cursor-pointer">
                      <div>
                        <p className="font-semibold text-zinc-100 group-hover:text-[#FF5A36] transition-colors">
                          {row.productName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                          <span>{row.sku}</span>
                          <span>•</span>
                          <span className="text-zinc-400">{row.locationName}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell onClick={() => handleRowClick(row)} className="text-right font-mono text-zinc-200 cursor-pointer font-medium">
                      {row.costPerUnit} Rs
                    </TableCell>

                    <TableCell onClick={() => handleRowClick(row)} className="text-right font-mono font-bold text-white cursor-pointer">
                      {row.onHand}
                    </TableCell>

                    <TableCell onClick={() => handleRowClick(row)} className="text-right font-mono font-bold text-emerald-400 cursor-pointer">
                      {row.freeToUse}
                    </TableCell>

                    <TableCell onClick={() => handleRowClick(row)} className="text-center cursor-pointer">
                      {row.isOutOfStock ? (
                        <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
                          Out of Stock
                        </Badge>
                      ) : row.isLowStock ? (
                        <Badge variant="warning" className="text-[10px] uppercase font-semibold">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] uppercase font-semibold">
                          Optimal
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/adjustments/new?productId=${row.productId}&locationId=${row.locationId}`)
                        }}
                        className="h-7 text-xs border-zinc-700 bg-zinc-900 hover:bg-[#FF5A36] hover:text-white hover:border-[#FF5A36] gap-1 text-zinc-300"
                        title="Update physical stock count for this product"
                      >
                        <SlidersHorizontal className="h-3 w-3 text-[#FF5A36] group-hover:text-white" />
                        <span>Update Stock</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Side Panel (Sheet) for Row Details + Adjust Shortcut */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="bg-zinc-950 border-l border-zinc-800 text-white w-full sm:max-w-md">
          {selectedItem && (
            <div className="space-y-6 flex flex-col h-full">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#FF5A36]" />
                  <SheetTitle className="text-lg font-bold text-white">
                    {selectedItem.productName}
                  </SheetTitle>
                </div>
                <SheetDescription className="text-xs text-zinc-400 font-mono">
                  SKU: {selectedItem.sku} • Location: {selectedItem.locationName}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 flex-1">
                {/* Status Alert Banner */}
                {selectedItem.isLowStock && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-amber-800/60 bg-amber-950/40 p-3 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      Current stock ({selectedItem.onHand}) is at or below reorder threshold ({selectedItem.reorderPoint}).
                    </span>
                  </div>
                )}

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-500 uppercase">On Hand Total</p>
                    <p className="text-xl font-bold font-mono text-white mt-1">
                      {selectedItem.onHand} {selectedItem.uom}
                    </p>
                  </div>

                  <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-500 uppercase">Free to Use</p>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {selectedItem.freeToUse} {selectedItem.uom}
                    </p>
                  </div>

                  <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-500 uppercase">Allocated to Outbound</p>
                    <p className="text-xl font-bold font-mono text-sky-400 mt-1">
                      {selectedItem.allocated} {selectedItem.uom}
                    </p>
                  </div>

                  <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-500 uppercase">Unit Valuation</p>
                    <p className="text-xl font-bold font-mono text-zinc-200 mt-1">
                      ${selectedItem.costPerUnit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2 text-xs border-t border-zinc-800/80 pt-4">
                  <div className="flex justify-between py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">Category:</span>
                    <span className="text-zinc-200 font-medium">{selectedItem.categoryName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">Reorder Threshold:</span>
                    <span className="text-zinc-200 font-mono">{selectedItem.reorderPoint} {selectedItem.uom}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Storage Zone:</span>
                    <span className="text-zinc-200">{selectedItem.locationName}</span>
                  </div>
                </div>
              </div>

              {/* Sheet Action Footer with "Adjust" Shortcut */}
              <SheetFooter className="border-t border-zinc-800/80 pt-4 gap-2">
                <Button
                  onClick={handleAdjustShortcut}
                  className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold gap-2 shadow-lg shadow-[#FF5A36]/20"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Adjust Stock Quantity
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default StockLevelsPage
