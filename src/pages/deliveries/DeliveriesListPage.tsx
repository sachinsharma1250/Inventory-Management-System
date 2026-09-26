import React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpFromLine, Plus } from "lucide-react"

// TODO: [Team Member 3] Implement Delivery Orders (Outgoing Goods) List
// - Query `deliveriesCol` with TanStack Query
// - Status filter (draft, waiting, ready, done, cancelled)
// - Create new Delivery Order form (Customer, scheduledDate, source location, lines)
// - 3-step process: Pick -> Pack -> Validate (reduces stock & logs to ledger)

export const DeliveriesListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowUpFromLine className="h-6 w-6 text-[#FF5A36]" />
            Delivery Orders (Outgoing Stock)
          </h1>
          <p className="text-sm text-zinc-400">
            Fulfill customer shipments, sales dispatches, and outgoing transport orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400">
            Route: /deliveries
          </Badge>
          <Button size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5">
            <Plus className="h-4 w-4" />
            New Delivery
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 3 (Deliveries & Outbound)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Implement Delivery Orders table, status indicators, and create drawer.
          </p>
          <Link to="/deliveries/del-001" className="text-xs text-[#FF5A36] hover:underline block">
            Test delivery detail route: /deliveries/del-001 →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
export default DeliveriesListPage
