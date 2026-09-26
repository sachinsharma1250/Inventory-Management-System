import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"

// TODO: [Team Member 4] Implement Stock Ledger & Move History Audit Trail
// - Query `stock_ledger` collection ordered by timestamp desc
// - Display columns: Timestamp, Product, Location, Qty Delta (+/-), Reference Type, Reference ID, User
// - Filter by RefType (receipt, delivery, transfer, adjustment)
// - Filter by Product or Location
// - Export to CSV option

export const MoveHistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-[#FF5A36]" />
            Move History (Stock Ledger)
          </h1>
          <p className="text-sm text-zinc-400">
            Immutable log of all stock movements: receipts, deliveries, internal transfers, and adjustments.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /move-history
        </Badge>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 4 (Ledger & Audit Trail)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Query `stockLedgerCol` using TanStack Query, build filterable table with +/- delta colors.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default MoveHistoryPage
