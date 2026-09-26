import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal } from "lucide-react"

// TODO: [Team Member 4] Implement Stock Adjustment Screen
// - Select Product and Location
// - Fetch current recorded stock from `stock_levels`
// - Enter actual physical counted quantity
// - Calculate difference: diff = countedQty - recordedQty
// - Validate adjustment:
//   * Auto-update `stock_levels` onHand to countedQty
//   * Log delta to `stock_ledger` (qtyDelta = diff, refType = "adjustment")

export const NewAdjustmentPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-[#FF5A36]" />
            New Stock Adjustment
          </h1>
          <p className="text-sm text-zinc-400">
            Reconcile physical inventory counts against system records (damaged, lost, or found items).
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /adjustments/new
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
            // TODO: Implement adjustment form: Product/Location picker, counted qty input, auto-computed diff, and validate button.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default NewAdjustmentPage
