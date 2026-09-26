import React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine, Plus } from "lucide-react"

// TODO: [Team Member 3] Implement Receipts (Incoming Goods) List
// - Query `receiptsCol` with TanStack Query
// - Status filter (draft, waiting, ready, done, cancelled)
// - Create new Receipt dialog/form (Supplier, scheduledDate, destination location, items lines)
// - Validation action: on Validate -> status = "done", update `stock_levels` (+qty) & append to `stock_ledger`

export const ReceiptsListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowDownToLine className="h-6 w-6 text-[#FF5A36]" />
            Receipts (Incoming Stock)
          </h1>
          <p className="text-sm text-zinc-400">
            Process supplier deliveries, purchase receipts, and inbound shipments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400">
            Route: /receipts
          </Badge>
          <Button size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5">
            <Plus className="h-4 w-4" />
            New Receipt
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 3 (Receipts & Inbound)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Implement Receipts list table with status badges and validate button.
          </p>
          <Link to="/receipts/rcpt-001" className="text-xs text-[#FF5A36] hover:underline block">
            Test receipt detail route: /receipts/rcpt-001 →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
export default ReceiptsListPage
