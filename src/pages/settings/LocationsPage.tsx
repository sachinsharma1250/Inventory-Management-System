import React, { useState } from "react"
import { MapPin, Plus, Edit, Trash2, ShieldAlert, Building2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from "@/hooks/useLocations"
import { useWarehouses } from "@/hooks/useWarehouses"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Location } from "@/types"

export const LocationsPage: React.FC = () => {
  const { isManager, role } = useAuth()
  const { warehouses } = useWarehouses()
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")

  const { locations, isLoading } = useLocations(selectedWarehouseId)
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [name, setName] = useState("")
  const [shortCode, setShortCode] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setEditingLocation(null)
    setName("")
    setShortCode("")
    setWarehouseId(warehouses[0]?.id || "wh-main")
    setError(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc)
    setName(loc.name)
    setShortCode(loc.shortCode)
    setWarehouseId(loc.warehouseId)
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isManager) {
      setError("Permission Denied: Only users with 'manager' role can write warehouse locations.")
      return
    }

    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
          name,
          shortCode,
          warehouseId,
        })
      } else {
        await createMutation.mutateAsync({
          name,
          shortCode,
          warehouseId,
        })
      }
      setDialogOpen(false)
    } catch (err: any) {
      setError(err?.message || "Failed to save location")
    }
  }

  const handleDelete = async (id: string) => {
    if (!isManager) return
    if (confirm("Are you sure you want to delete this rack/location?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const getWarehouseName = (wId: string) => {
    const found = warehouses.find((w) => w.id === wId)
    return found ? `${found.name} (${found.shortCode})` : wId
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#FF5A36]" />
            Location & Rack Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Define zones, storage aisles, racks, and picking bins across warehouses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={
              isManager
                ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-400"
                : "border-amber-700/60 bg-amber-950/40 text-amber-400"
            }
          >
            Role: {role.toUpperCase()} {isManager ? "(Manager Write Access)" : "(Staff Read-Only)"}
          </Badge>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            disabled={!isManager}
            className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Security Rule Alert for Staff */}
      {!isManager && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Staff Permissions Active (Read-Only)</p>
            <p className="text-amber-400/80">
              Only users with <code className="font-mono text-amber-300">role == 'manager'</code> in Firestore may create, update, or remove location records.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Live Locations Table */}
      <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base text-zinc-100">Warehouse Sub-locations</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Live sync via Firestore <code className="text-zinc-400">onSnapshot</code>
              </CardDescription>
            </div>

            {/* Warehouse Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Location Code</TableHead>
                <TableHead className="text-zinc-400">Zone / Rack Name</TableHead>
                <TableHead className="text-zinc-400">Parent Warehouse</TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    Loading locations...
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    No locations found matching this filter.
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((loc) => (
                  <TableRow key={loc.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                    <TableCell>
                      <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700 font-mono">
                        {loc.shortCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-200">{loc.name}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {getWarehouseName(loc.warehouseId)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!isManager}
                          onClick={() => handleOpenEdit(loc)}
                          className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
                          title={isManager ? "Edit Location" : "Requires Manager Role"}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!isManager}
                          onClick={() => handleDelete(loc.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30 disabled:opacity-30"
                          title={isManager ? "Delete Location" : "Requires Manager Role"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure zone or rack storage identifier inside a parent warehouse.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="parentWarehouse" className="text-xs text-zinc-300">
                Parent Warehouse
              </Label>
              <select
                id="parentWarehouse"
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locShortCode" className="text-xs text-zinc-300">
                Location Code (e.g. WH1/Rack-A, WH1/Stock)
              </Label>
              <Input
                id="locShortCode"
                required
                placeholder="WH1/Rack-A"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locName" className="text-xs text-zinc-300">
                Location Name / Zone Description
              </Label>
              <Input
                id="locName"
                required
                placeholder="High-Velocity Picking Rack"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90"
              >
                {editingLocation ? "Save Changes" : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LocationsPage
