import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowDownToLine,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react"
import { useReceipts, useCreateReceipt } from "@/hooks/useReceipts"
import { useProducts } from "@/hooks/useProducts"
import { useLocations } from "@/hooks/useLocations"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { DocStatus, Receipt } from "@/types"

export const ReceiptsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

  const { receipts, isLoading } = useReceipts(search, statusFilter)
  const { allProducts } = useProducts()
  const { locations } = useLocations()
  const createReceipt = useCreateReceipt()

  // New Receipt Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [supplier, setSupplier] = useState("")
  const [contact, setContact] = useState("")
  const [targetLocation, setTargetLocation] = useState("loc-main-stock")
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  )
  const [selectedProductId, setSelectedProductId] = useState("")
  const [lineQty, setLineQty] = useState("50")
  const [formError, setFormError] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setSupplier("")
    setContact("")
    setTargetLocation(locations[0]?.id || "loc-main-stock")
    setSelectedProductId(allProducts[0]?.id || "prod-steel-rods")
    setLineQty("50")
    setFormError(null)
    setModalOpen(true)
  }

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!supplier.trim()) {
      setFormError("Supplier / Vendor name is required.")
      return
    }

    const selectedProd = allProducts.find((p) => p.id === selectedProductId)
    const qty = Number(lineQty) || 1

    try {
      const created = await createReceipt.mutateAsync({
        from: supplier.trim(),
        to: targetLocation,
        contact: contact.trim() || "vendor@supply.com",
        scheduledDate,
        lines: [
          {
            productId: selectedProductId,
            quantity: qty,
            productName: selectedProd?.name || "Inventory Item",
            sku: selectedProd?.sku || "SKU-ITEM",
            uom: selectedProd?.uom || "units",
          },
        ],
        notes: "Direct procurement receipt",
      })

      setModalOpen(false)
      navigate(`/receipts/${created.id}`)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create receipt")
    }
  }

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="border-zinc-700 text-zinc-400 uppercase text-[10px]">Draft</Badge>
      case "waiting":
        return <Badge className="bg-sky-950/60 text-sky-400 border border-sky-800 uppercase text-[10px]">Waiting</Badge>
      case "ready":
        return <Badge className="bg-amber-950/60 text-amber-400 border border-amber-800 uppercase text-[10px]">Ready</Badge>
      case "done":
        return <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 uppercase text-[10px]">Done</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="uppercase text-[10px]">Cancelled</Badge>
    }
  }

  const kanbanColumns: DocStatus[] = ["draft", "waiting", "ready", "done"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Receipts (Incoming Stock)</h1>
              <p className="text-xs text-zinc-400">
                Inbound supplier shipments, PO vouchers, and dock receiving
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              onClick={() => setViewMode("table")}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              onClick={() => setViewMode("kanban")}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5 text-xs shadow-md shadow-[#FF5A36]/20 font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Receipt
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by Reference (WH/IN/...), Supplier, or Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none h-9"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300 font-semibold">Reference</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">From</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">To</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">Contact</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">Schedule date</TableHead>
                  <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      Loading receipts...
                    </TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      No inbound receipts found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r) => {
                    return (
                      <TableRow
                        key={r.id}
                        onClick={() => navigate(`/receipts/${r.id}`)}
                        className="border-zinc-800/60 hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                      >
                        <TableCell>
                          <span className="font-mono font-bold text-white group-hover:text-[#FF5A36] transition-colors">
                            {r.reference}
                          </span>
                        </TableCell>

                        <TableCell className="font-medium text-zinc-200">
                          {r.from}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-zinc-300 font-mono">
                            {r.to === "loc-main-stock" ? "WH/Stock1" : r.to}
                          </span>
                        </TableCell>

                        <TableCell className="text-zinc-300 text-xs">
                          {r.contact}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-zinc-300 flex items-center gap-1.5 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            {r.scheduledDate}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          {getStatusBadge(r.status)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Kanban Board View by Status */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((colStatus) => {
            const colReceipts = receipts.filter((r) => r.status === colStatus)
            return (
              <div key={colStatus} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    {colStatus}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
                    {colReceipts.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colReceipts.map((r) => (
                    <Card
                      key={r.id}
                      onClick={() => navigate(`/receipts/${r.id}`)}
                      className="border-zinc-800 bg-zinc-950/80 hover:border-[#FF5A36]/60 cursor-pointer transition-all p-3 space-y-2 group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white group-hover:text-[#FF5A36]">
                          {r.reference}
                        </span>
                        {getStatusBadge(r.status)}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-zinc-200 truncate">{r.from}</p>
                        <p className="text-[11px] text-zinc-500">{r.contact}</p>
                      </div>

                      <div className="pt-1 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{r.lines?.length} items</span>
                        <span>{r.scheduledDate}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Receipt Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-[#FF5A36]" />
              Create Inbound Receipt Voucher
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Generate an inbound shipment document to receive goods into warehouse stock.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReceipt} className="space-y-4 py-2">
            {formError && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Supplier / Vendor *</Label>
              <Input
                required
                placeholder="e.g. Apex Steel Global"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Contact Email / Phone</Label>
              <Input
                placeholder="vendor@supply.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Destination Location</Label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Scheduled Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            {/* Initial Product Line */}
            <div className="border-t border-zinc-800/80 pt-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300">Initial Product Line</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    type="number"
                    min="1"
                    value={lineQty}
                    onChange={(e) => setLineQty(e.target.value)}
                    placeholder="Qty"
                    className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 text-xs font-semibold">
                Generate Draft Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReceiptsListPage
