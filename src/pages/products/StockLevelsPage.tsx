import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Boxes } from "lucide-react"

// TODO: [Team Member 2] Implement Stock Availability Per Location View
// - Aggregate query for onHand vs freeToUse per Product x Location
// - Filter by Warehouse and Location
// - Visual indicators for low stock (onHand <= reorderPoint)
// - Quick link to Initiate Transfer or Adjustment

export const StockLevelsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Boxes className="h-6 w-6 text-[#FF5A36]" />
            Stock Availability
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time on-hand and free-to-use quantities distributed across warehouses and racks.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /stock
        </Badge>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 2 (Products & Catalog)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Query `stockLevelsCol` joined with `productsCol` and `locationsCol`.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default StockLevelsPage
