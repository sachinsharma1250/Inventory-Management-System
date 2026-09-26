import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"

// TODO: [Team Member 1] Implement Multi-Warehouse Configuration
// - List warehouses from `warehousesCol`
// - Add / Edit Warehouse Dialog (name, shortCode, address)
// - View associated locations count

export const WarehousesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#FF5A36]" />
            Warehouse Management
          </h1>
          <p className="text-sm text-zinc-400">
            Configure physical warehouse buildings, facilities, and short codes (e.g. WH1, WH2).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400">
            Route: /settings/warehouses
          </Badge>
          <Button size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 1 (Auth & Multi-Warehouse Settings)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Wire CRUD operations to `warehousesCol` with create/edit modal.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
export default WarehousesPage
