import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight } from "lucide-react"

// TODO: [Team Member 4] Implement Internal Transfers Creation Screen
// - Source location selector (`fromLocationId`)
// - Destination location selector (`toLocationId`) (e.g. Main Store -> Production Floor, Rack A -> Rack B)
// - Items line table (Product, Quantity to move)
// - Validation action:
//   * Total stock stays unchanged
//   * Deduct from source `stock_levels`
//   * Add to destination `stock_levels`
//   * Log movements to `stock_ledger` (refType: "transfer")

export const NewTransferPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-[#FF5A36]" />
            New Internal Transfer
          </h1>
          <p className="text-sm text-zinc-400">
            Relocate stock between racks, production floors, and warehouse locations.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /transfers/new
        </Badge>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 4 (Transfers & Adjustments)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Implement Transfer form with location selectors, line items, and transaction commit.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default NewTransferPage
