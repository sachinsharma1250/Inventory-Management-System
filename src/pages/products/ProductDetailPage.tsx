import React, { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Package,
  Barcode,
  Layers,
  SlidersHorizontal,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Save,
} from "lucide-react"
import { useProducts, useUpdateProduct, useCategories } from "@/hooks/useProducts"
import { useStock } from "@/hooks/useStock"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { allProducts } = useProducts()
  const { categories } = useCategories()
  const { allStock } = useStock()
  const updateProduct = useUpdateProduct()

  const product = allProducts.find((p) => p.id === id)
  const productStockRows = allStock.filter((s) => s.productId === id)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(product?.name || "")
  const [cost, setCost] = useState(String(product?.costPerUnit || "0"))
  const [reorder, setReorder] = useState(String(product?.reorderPoint || "0"))
  const [barcode, setBarcode] = useState(product?.barcode || "")

  if (!product) {
    return (
      <div className="space-y-6">
        <Link to="/products" className="text-xs text-[#FF5A36] hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <Card className="border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
          Product with ID "{id}" was not found in catalog.
        </Card>
      </div>
    )
  }

  const category = categories.find((c) => c.id === product.categoryId)
  const totalOnHand = productStockRows.reduce((sum, s) => sum + s.onHand, 0)
  const totalFreeToUse = productStockRows.reduce((sum, s) => sum + s.freeToUse, 0)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProduct.mutateAsync({
      id: product.id,
      name,
      costPerUnit: Number(cost) || 0,
      reorderPoint: Number(reorder) || 0,
      barcode: barcode.trim() || undefined,
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{product.name}</h1>
              <Badge className="bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/30 font-mono">
                {product.sku}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Category: {category?.name || "General"} • UoM: {product.uom}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/adjustments/new?productId=${product.id}`)}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5A36]" />
            Adjust Stock
          </Button>

          <Button
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            {isEditing ? "Cancel Edit" : "Edit Attributes"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[11px] text-zinc-500 uppercase">Total on Hand</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalOnHand} <span className="text-xs font-normal text-zinc-500">{product.uom}</span>
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[11px] text-zinc-500 uppercase">Free to Use</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {totalFreeToUse} <span className="text-xs font-normal text-zinc-500">{product.uom}</span>
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[11px] text-zinc-500 uppercase">Cost per Unit</p>
          <p className="text-2xl font-bold font-mono text-zinc-200 mt-1">
            ${Number(product.costPerUnit).toFixed(2)}
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[11px] text-zinc-500 uppercase">Reorder Point</p>
          <p className="text-2xl font-bold font-mono text-zinc-200 mt-1">
            {product.reorderPoint} <span className="text-xs font-normal text-zinc-500">{product.uom}</span>
          </p>
        </Card>
      </div>

      {/* Edit Form or Specification Card */}
      {isEditing ? (
        <Card className="border-zinc-800 bg-zinc-950/80 p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-base font-bold text-white">Edit Master Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-zinc-300">Product Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Cost per Unit ($)</Label>
                <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-zinc-900 border-zinc-800" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Reorder Threshold</Label>
                <Input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} className="bg-zinc-900 border-zinc-800" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-zinc-300">Barcode</Label>
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="bg-zinc-900 border-zinc-800 font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90">Save Changes</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Stock Distribution by Location */}
      <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/80 pb-3">
          <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#FF5A36]" />
            Location Distribution Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Real-time stock quantities across warehouse facilities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-300">Warehouse Location</TableHead>
                <TableHead className="text-zinc-300 text-right">On Hand</TableHead>
                <TableHead className="text-zinc-300 text-right">Allocated</TableHead>
                <TableHead className="text-zinc-300 text-right">Free to Use</TableHead>
                <TableHead className="text-right text-zinc-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productStockRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                    No location records registered for this product.
                  </TableCell>
                </TableRow>
              ) : (
                productStockRows.map((row) => (
                  <TableRow key={row.locationId} className="border-zinc-800/60">
                    <TableCell className="font-medium text-zinc-200">{row.locationName}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-white">{row.onHand} {product.uom}</TableCell>
                    <TableCell className="text-right font-mono text-sky-400">{row.allocated} {product.uom}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-400 font-bold">{row.freeToUse} {product.uom}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/adjustments/new?productId=${product.id}&locationId=${row.locationId}`)}
                        className="text-xs text-[#FF5A36] hover:bg-[#FF5A36]/10"
                      >
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductDetailPage
