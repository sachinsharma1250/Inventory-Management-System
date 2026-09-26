import React, { useState } from "react"
import { Building2, Plus, Edit, Trash2, ShieldAlert, CheckCircle2, MapPin } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from "@/hooks/useWarehouses"
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
import type { Warehouse } from "@/types"

export const WarehousesPage: React.FC = () => {
  const { isManager, role } = useAuth()
  const { warehouses, isLoading } = useWarehouses()
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const deleteMutation = useDeleteWarehouse()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [name, setName] = useState("")
  const [shortCode, setShortCode] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setEditingWarehouse(null)
    setName("")
    setShortCode("")
    setAddress("")
    setError(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWarehouse(wh)
    setName(wh.name)
    setShortCode(wh.shortCode)
    setAddress(wh.address)
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isManager) {
      setError("Permission Denied: Only users with 'manager' role can write warehouses.")
      return
    }

    try {
      if (editingWarehouse) {
        await updateMutation.mutateAsync({
          id: editingWarehouse.id,
          name,
          shortCode: shortCode.toUpperCase(),
          address,
        })
      } else {
        await createMutation.mutateAsync({
          name,
          shortCode: shortCode.toUpperCase(),
          address,
        })
      }
      setDialogOpen(false)
    } catch (err: any) {
      setError(err?.message || "Failed to save warehouse")
    }
  }

  const handleDelete = async (id: string) => {
    if (!isManager) return
    if (confirm("Are you sure you want to delete this warehouse?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#FF5A36]" />
            Warehouse Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Physical facility definitions, operational codes, and geographic distribution.
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
            Add Warehouse
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
              Per <code className="font-mono text-zinc-300">firestore.rules</code>, only users with{" "}
              <code className="font-mono text-amber-300">role == 'manager'</code> are authorized to write or mutate warehouse entities.
            </p>
          </div>
        </div>
      )}

      {/* Live Warehouses Table */}
      <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-zinc-100">Configured Facilities</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Live sync via Firestore <code className="text-zinc-400">onSnapshot</code>
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-mono">
              {warehouses.length} {warehouses.length === 1 ? "Warehouse" : "Warehouses"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Short Code</TableHead>
                <TableHead className="text-zinc-400">Warehouse Name</TableHead>
                <TableHead className="text-zinc-400">Physical Address</TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    Loading warehouses...
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    No warehouses configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((wh) => (
                  <TableRow key={wh.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                    <TableCell>
                      <Badge className="bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/30 font-mono">
                        {wh.shortCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-200">{wh.name}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                        {wh.address}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!isManager}
                          onClick={() => handleOpenEdit(wh)}
                          className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
                          title={isManager ? "Edit Warehouse" : "Requires Manager Role"}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!isManager}
                          onClick={() => handleDelete(wh.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30 disabled:opacity-30"
                          title={isManager ? "Delete Warehouse" : "Requires Manager Role"}
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

      {/* Add / Edit Warehouse Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Only users with <code className="text-zinc-300">manager</code> permissions can commit warehouse records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="shortCode" className="text-xs text-zinc-300">
                Short Code (e.g. WH1, WH2)
              </Label>
              <Input
                id="shortCode"
                required
                maxLength={8}
                placeholder="WH1"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-zinc-300">
                Warehouse Name
              </Label>
              <Input
                id="name"
                required
                placeholder="Central Distribution Center"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs text-zinc-300">
                Physical Address
              </Label>
              <Input
                id="address"
                required
                placeholder="100 Logistics Blvd, Chicago, IL"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                {editingWarehouse ? "Save Changes" : "Create Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WarehousesPage
