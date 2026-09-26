import React from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowUpFromLine } from "lucide-react"

// TODO: [Team Member 3] Implement Delivery Order Detail & Fulfillment View
// - Fetch Delivery record by ID from `deliveriesCol`
// - Step controls: Check Availability -> Pick Items -> Pack Items -> Validate Outbound
// - On Validate Outbound: Deduct quantities from `stock_levels` (freeToUse and onHand)
// - Append ledger entries to `stock_ledger` with refType = "delivery"

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/deliveries"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowUpFromLine className="h-6 w-6 text-[#FF5A36]" />
            Delivery Order Detail
          </h1>
          <p className="text-sm text-zinc-400">
            Viewing shipment dispatch: <span className="font-mono text-zinc-200">{id}</span>
          </p>
        </div>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 3 (Deliveries & Outbound)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400">
            Delivery ID: {id}
          </Badge>
          <p className="font-mono text-xs text-zinc-500 mt-2">
            // TODO: Fetch Delivery object, display items picking checklist, and wire validation dispatch.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default DeliveryDetailPage
