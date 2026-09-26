import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Filter,
  RotateCcw,
  Bell,
  BellRing,
  ExternalLink,
  Building2,
  Tags,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDashboardKpis } from "@/hooks/useDashboardKpis"
import {
  DashboardFiltersProvider,
  useDashboardFilters,
} from "@/hooks/useDashboardFilters"
import { useLowStockNotification } from "@/hooks/useLowStockNotification"
import { useWarehouses } from "@/hooks/useWarehouses"
import type { DocTypeFilter, StatusFilter } from "@/types"

const DashboardContent: React.FC = () => {
  const navigate = useNavigate()
  const kpis = useDashboardKpis()
  const { filters, setDocType, setStatus, setWarehouseId, setCategoryId, resetFilters, isFiltered } =
    useDashboardFilters()
  const { warehouses } = useWarehouses()

  // Track dynamic low-stock notifications and permission
  const [simulatedOffset, setSimulatedOffset] = useState(0)
  const effectiveLowStockCount = kpis.totalLowOrOutOfStockCount + simulatedOffset
  const { permission, requestPermission, isSupported } = useLowStockNotification(effectiveLowStockCount)

  const handleSimulateAlert = () => {
    // Increment low stock count to trigger the Notification Web API
    setSimulatedOffset((prev) => prev + 1)
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Operations Dashboard
              </h1>
              <p className="text-xs text-zinc-400">
                Live Firestore listeners active • Real-time inventory sync without polling
              </p>
            </div>
          </div>
        </div>

        {/* Notification Status & Test Control */}
        <div className="flex items-center gap-2">
          {isSupported && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Bell className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400">Alerts:</span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-mono ${
                  permission === "granted"
                    ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-400"
                    : permission === "denied"
                    ? "border-red-700/60 bg-red-950/40 text-red-400"
                    : "border-amber-700/60 bg-amber-950/40 text-amber-400"
                }`}
              >
                {permission}
              </Badge>
              {permission !== "granted" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={requestPermission}
                  className="h-6 px-2 text-[11px] text-[#FF5A36] hover:bg-[#FF5A36]/10"
                >
                  Enable
                </Button>
              )}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleSimulateAlert}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-[#FF5A36]/10 hover:border-[#FF5A36]/50 text-xs gap-1.5"
            title="Simulate a low stock increase to test the browser Notification Web API"
          >
            <BellRing className="h-3.5 w-3.5 text-[#FF5A36]" />
            <span className="hidden sm:inline">Simulate Alert</span>
          </Button>
        </div>
      </div>

      {/* Wireframe Mockup Reference: Primary Operations Cards (Receipt & Delivery) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Card */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl hover:border-zinc-700 transition-all p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-sky-400" />
              Receipt
            </h3>
            <Badge variant="outline" className="border-sky-800 text-sky-400 text-xs">
              Incoming
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <Button
              onClick={() => navigate("/receipts")}
              className="h-14 px-6 rounded-xl bg-zinc-900 hover:bg-[#FF5A36] border border-zinc-800 hover:border-[#FF5A36] text-white font-bold text-base shadow-lg transition-all group"
            >
              <span className="font-mono text-lg mr-2 text-[#FF5A36] group-hover:text-white">
                {kpis.receiptsToReceiveCount}
              </span>
              to receive
            </Button>

            <div className="space-y-1.5 text-right font-medium">
              <p className="text-rose-400 text-sm flex items-center justify-end gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                {kpis.lateReceiptsCount} Late
              </p>
              <p className="text-zinc-400 text-xs">
                {kpis.totalReceiptsCount} operations
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery Card */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl hover:border-zinc-700 transition-all p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-emerald-400" />
              Delivery
            </h3>
            <Badge variant="outline" className="border-emerald-800 text-emerald-400 text-xs">
              Outgoing
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <Button
              onClick={() => navigate("/deliveries")}
              className="h-14 px-6 rounded-xl bg-zinc-900 hover:bg-[#FF5A36] border border-zinc-800 hover:border-[#FF5A36] text-white font-bold text-base shadow-lg transition-all group"
            >
              <span className="font-mono text-lg mr-2 text-[#FF5A36] group-hover:text-white">
                {kpis.deliveriesToDeliverCount}
              </span>
              to Deliver
            </Button>

            <div className="space-y-1.5 text-right font-medium">
              <p className="text-rose-400 text-sm flex items-center justify-end gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                {kpis.lateDeliveriesCount} Late
              </p>
              <p className="text-amber-400 text-xs font-semibold">
                {kpis.waitingDeliveriesCount} waiting
              </p>
              <p className="text-zinc-400 text-xs">
                {kpis.totalDeliveriesCount} operations
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 5 Real-Time KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Total Products in Stock */}
        <Card className="border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Total in Stock</span>
              <Boxes className="h-4 w-4 text-[#FF5A36]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.totalProductsInStock.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sum of all <code className="text-zinc-400">onHand</code> units
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Low Stock / Out of Stock Items */}
        <Card
          onClick={() => navigate("/products?filter=low-stock")}
          className="border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-zinc-950/70 hover:border-amber-600/60 transition-all cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-medium uppercase tracking-wider">Low / Out of Stock</span>
              <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-amber-300 font-mono">
                {effectiveLowStockCount}
              </div>
              <Badge className="bg-amber-950/60 text-amber-400 border border-amber-800/80 text-[10px]">
                {kpis.outOfStockItemsCount} critical
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400 group-hover:text-amber-300 flex items-center gap-1 transition-colors">
              <span>View flagged products</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Pending Receipts */}
        <Card
          onClick={() => navigate("/receipts")}
          className="border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Receipts</span>
              <ArrowDownToLine className="h-4 w-4 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.pendingReceiptsCount}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Status in <span className="text-sky-400 font-mono">waiting, ready</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Deliveries */}
        <Card
          onClick={() => navigate("/deliveries")}
          className="border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Deliveries</span>
              <ArrowUpFromLine className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.pendingDeliveriesCount}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Status in <span className="text-emerald-400 font-mono">waiting, ready</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Internal Transfers Scheduled */}
        <Card
          onClick={() => navigate("/transfers/new")}
          className="border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Transfers Scheduled</span>
              <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {kpis.scheduledTransfersCount}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Active relocations (<span className="text-indigo-400 font-mono">status != done</span>)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shared Dynamic Filters Bar */}
      <Card className="border-zinc-800 bg-zinc-950/90 shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#FF5A36]" />
              <CardTitle className="text-sm font-semibold text-zinc-200">
                Dynamic Operations Filters
              </CardTitle>
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs text-zinc-400 hover:text-white gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Shared state object for cross-module filtering: Document Type, Status, Warehouse, Category.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Document Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Document Type
              </label>
              <select
                value={filters.docType}
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
                Document Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="waiting">Waiting</option>
                <option value="ready">Ready</option>
                <option value="done">Done</option>
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
                value={filters.warehouseId}
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
                value={filters.categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="cat-raw">Raw Materials</option>
                <option value="cat-steel">Steel & Metals</option>
                <option value="cat-parts">Components & Fasteners</option>
                <option value="cat-finished">Finished Goods</option>
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {isFiltered && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-500">Active Criteria:</span>
              {filters.docType !== "all" && (
                <Badge variant="outline" className="border-[#FF5A36]/40 text-[#FF5A36] bg-[#FF5A36]/10 text-xs">
                  Type: {filters.docType}
                </Badge>
              )}
              {filters.status !== "all" && (
                <Badge variant="outline" className="border-sky-500/40 text-sky-400 bg-sky-950/30 text-xs">
                  Status: {filters.status}
                </Badge>
              )}
              {filters.warehouseId !== "all" && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-xs">
                  Warehouse: {filters.warehouseId}
                </Badge>
              )}
              {filters.categoryId !== "all" && (
                <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-950/30 text-xs">
                  Category: {filters.categoryId}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const DashboardPage: React.FC = () => {
  return (
    <DashboardFiltersProvider>
      <DashboardContent />
    </DashboardFiltersProvider>
  )
}

export default DashboardPage
