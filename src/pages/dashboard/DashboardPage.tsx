import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard } from "lucide-react"

// TODO: [Team Member 4] Implement Dashboard KPIs & Real-time Operations Snapshot
// - Total Products in Stock
// - Low Stock / Out of Stock Items Alert
// - Pending Receipts Counter
// - Pending Deliveries Counter
// - Scheduled Internal Transfers
// - Dynamic filters (DocType, Status, Warehouse, Category)

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-[#FF5A36]" />
            Inventory Dashboard
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time snapshot of warehouses, stock levels, and active operations.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-[#FF5A36]/40 text-[#FF5A36] bg-[#FF5A36]/10">
          Route: /dashboard
        </Badge>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 4 (Dashboard & Metrics)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Implement KPI summary cards, filter bars, and quick action widgets.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default DashboardPage
