import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode } from "lucide-react"

// TODO: [Team Member 2] Implement Barcode / QR Scanner Page
// - Web camera barcode scanning or manual barcode input simulation
// - Lookup product by barcode field in `productsCol`
// - Quick actions: View product details, add to receipt, initiate internal move

export const BarcodeScanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <QrCode className="h-6 w-6 text-[#FF5A36]" />
            Barcode Scanner
          </h1>
          <p className="text-sm text-zinc-400">
            Scan product or location barcodes for picking, shelving, and instant lookup.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /scan
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
            // TODO: Implement camera barcode stream or keyboard barcode scanner listener.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default BarcodeScanPage
