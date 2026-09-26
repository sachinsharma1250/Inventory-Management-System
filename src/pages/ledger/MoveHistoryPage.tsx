import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  History,
  Download,
  Plus,
  Filter,
  RotateCcw,
  Search,
  ArrowLeftRight,
  SlidersHorizontal,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Building2,
  Tags,
  Calendar,
  Layers,
  Table as TableIcon,
  Kanban,
} from "lucide-react"
import { useMoveHistory, exportMoveHistoryToCsv, type MoveHistoryFilterOptions } from "@/hooks/useMoveHistory"
import { useWarehouses } from "@/hooks/useWarehouses"
import { useCategories } from "@/hooks/useProducts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocTypeFilter, StatusFilter } from "@/types"

export const MoveHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { warehouses } = useWarehouses()
  const { categories } = useCategories()

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [docType, setDocType] = useState<DocTypeFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [warehouseId, setWarehouseId] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

  const filterOptions: MoveHistoryFilterOptions = {
    searchQuery,
    docType,
    status,
    warehouseId,
    categoryId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  const { rows, totalCount, isLoading } = useMoveHistory(filterOptions)

  const isFiltered =
    searchQuery.trim() !== "" ||
    docType !== "all" ||
    status !== "all" ||
    warehouseId !== "all" ||
    categoryId !== "all" ||
    startDate !== "" ||
    endDate !== ""

  const handleResetFilters = () => {
    setSearchQuery("")
    setDocType("all")
    setStatus("all")
    setWarehouseId("all")
    setCategoryId("all")
    setStartDate("")
    setEndDate("")
  }

  const handleExportCsv = () => {
    if (rows.length === 0) return
    exportMoveHistoryToCsv(rows)
  }

  const getRefTypeBadge = (refType: string) => {
    switch (refType) {
      case "receipt":
        return (
          <Badge variant="outline" className="border-sky-800 bg-sky-950/40 text-sky-400 text-[10px] gap-1">
            <ArrowDownToLine className="h-2.5 w-2.5" />
            Receipt
          </Badge>
        )
      case "delivery":
        return (
          <Badge variant="outline" className="border-rose-800 bg-rose-950/40 text-rose-400 text-[10px] gap-1">
            <ArrowUpFromLine className="h-2.5 w-2.5" />
            Delivery
          </Badge>
        )
      case "transfer":
        return (
          <Badge variant="outline" className="border-indigo-800 bg-indigo-950/40 text-indigo-400 text-[10px] gap-1">
            <ArrowLeftRight className="h-2.5 w-2.5" />
            Transfer
          </Badge>
        )
      case "adjustment":
        return (
          <Badge variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-400 text-[10px] gap-1">
            <SlidersHorizontal className="h-2.5 w-2.5" />
            Adjustment
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-[10px]">
            {refType}
          </Badge>
        )
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case "done":
        return (
          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 text-[10px]">
            Done
          </Badge>
        )
      case "ready":
        return (
          <Badge className="bg-sky-950/60 text-sky-400 border border-sky-800/80 text-[10px]">
            Ready
          </Badge>
        )
      case "waiting":
        return (
          <Badge className="bg-amber-950/60 text-amber-400 border border-amber-800/80 text-[10px]">
            Waiting
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="border-zinc-700 bg-zinc-800/40 text-zinc-400 text-[10px]">
            Draft
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-950/60 text-red-400 border border-red-800/80 text-[10px]">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-[10px]">
            {st}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Move History
                <span className="text-xs font-normal text-zinc-400 font-mono">
                  ({rows.length} of {totalCount} records)
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Immutable audit trail of all warehouse stock movements (receipts, deliveries, transfers, adjustments)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle matching Image 5 */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              onClick={() => setViewMode("table")}
              className="h-7 px-2.5 text-xs gap-1"
              title="Table List View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              onClick={() => setViewMode("kanban")}
              className="h-7 px-2.5 text-xs gap-1"
              title="Kanban Board by Status"
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </Button>
          </div>

          {/* CSV Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-[#FF5A36]/10 hover:border-[#FF5A36]/50 text-xs gap-1.5 text-zinc-300 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-[#FF5A36]" />
            Export CSV
          </Button>

          {/* New Operation Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-[#FF5A36]/25"
              >
                <Plus className="h-3.5 w-3.5" />
                New Operation
                <ChevronDown className="h-3 w-3 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
              <DropdownMenuLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Create Movement
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate("/transfers/new")}
                className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white"
              >
                <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
                <span>Internal Transfer</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/adjustments/new")}
                className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white"
              >
                <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                <span>Stock Adjustment</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={() => navigate("/receipts")}
                className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white"
              >
                <ArrowDownToLine className="h-4 w-4 text-sky-400" />
                <span>Incoming Receipt</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/deliveries")}
                className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white"
              >
                <ArrowUpFromLine className="h-4 w-4 text-rose-400" />
                <span>Delivery Order</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Row styled like Dashboard */}
      <Card className="border-zinc-800 bg-zinc-950/90 shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#FF5A36]" />
              <CardTitle className="text-sm font-semibold text-zinc-200">
                Filter Audit Records
              </CardTitle>
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-zinc-400 hover:text-white gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Real-time filter stream across document types, statuses, locations, and date ranges
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Top Row: Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search reference (WH/IN/...), product name, contact, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-white text-xs"
            />
          </div>

          {/* Grid Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Document Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocTypeFilter)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Document Types</option>
                <option value="receipts">Receipts (Incoming)</option>
                <option value="deliveries">Deliveries (Outgoing)</option>
                <option value="transfers">Internal Transfers</option>
                <option value="adjustments">Stock Adjustments</option>
              </select>
            </div>

            {/* 2. Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="done">Done</option>
                <option value="ready">Ready</option>
                <option value="waiting">Waiting</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* 3. Warehouse */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3 text-zinc-500" />
                Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Product Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Tags className="h-3 w-3 text-zinc-500" />
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
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

          {/* Date Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-zinc-500" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-xs h-8"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-zinc-500" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-xs h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Switching: Table or Kanban */}
      {viewMode === "table" ? (
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-900/60">
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300 font-semibold">Reference</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">Date</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">Contact</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">From</TableHead>
                  <TableHead className="text-zinc-300 font-semibold">To</TableHead>
                  <TableHead className="text-zinc-300 font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      <History className="h-8 w-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                      <p className="text-sm font-medium text-zinc-400">No stock movements found</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {isFiltered
                          ? "Try clearing filters to see all movements"
                          : "Perform a receipt, delivery, transfer, or adjustment to populate the ledger"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const isPositive = row.quantity > 0
                    const isZero = row.quantity === 0
                    return (
                      <TableRow
                        key={row.id}
                        className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors"
                      >
                        {/* 1. Reference */}
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {getRefTypeBadge(row.refType)}
                            <span className="font-semibold text-white tracking-wide">
                              {row.reference}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-sans block mt-0.5">
                            {row.productName}
                          </span>
                        </TableCell>

                        {/* 2. Date */}
                        <TableCell className="text-xs text-zinc-400 font-mono">
                          {row.formattedDate}
                        </TableCell>

                        {/* 3. Contact */}
                        <TableCell className="text-xs text-zinc-300 font-medium">
                          {row.contact}
                        </TableCell>

                        {/* 4. From */}
                        <TableCell className="text-xs text-zinc-300 font-mono">
                          {row.from}
                        </TableCell>

                        {/* 5. To */}
                        <TableCell className="text-xs text-zinc-300 font-mono">
                          {row.to}
                        </TableCell>

                        {/* 6. Quantity (In event green, Out moves red) */}
                        <TableCell className="text-right font-mono text-xs font-bold">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded font-mono ${
                              isPositive
                                ? "text-emerald-400 bg-emerald-950/60 border border-emerald-800/60"
                                : isZero
                                ? "text-zinc-400 bg-zinc-900"
                                : "text-rose-400 bg-rose-950/60 border border-rose-800/60"
                            }`}
                          >
                            {isPositive ? `+${row.quantity}` : `${row.quantity}`}
                          </span>
                        </TableCell>

                        {/* 7. Status */}
                        <TableCell className="text-center">
                          {getStatusBadge(row.status)}
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
        /* Kanban Board View by Status matching Image 5 */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["draft", "waiting", "ready", "done"] as const).map((colStatus) => {
            const colRows = rows.filter((r) => r.status.toLowerCase() === colStatus)
            return (
              <div key={colStatus} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    {colStatus}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
                    {colRows.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colRows.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-600">
                      No {colStatus} records
                    </div>
                  ) : (
                    colRows.map((r) => {
                      const isPositive = r.quantity > 0
                      return (
                        <Card
                          key={r.id}
                          className="border-zinc-800 bg-zinc-950/80 hover:border-[#FF5A36]/60 p-3 space-y-2 shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white">
                              {r.reference}
                            </span>
                            {getRefTypeBadge(r.refType)}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-zinc-200 truncate">{r.productName}</p>
                            <p className="text-[11px] text-zinc-400 truncate">Contact: {r.contact}</p>
                          </div>

                          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
                            <span className="text-zinc-500">{r.formattedDate}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                isPositive
                                  ? "text-emerald-400 bg-emerald-950/40"
                                  : "text-rose-400 bg-rose-950/40"
                              }`}
                            >
                              {isPositive ? `+${r.quantity}` : `${r.quantity}`}
                            </span>
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MoveHistoryPage
