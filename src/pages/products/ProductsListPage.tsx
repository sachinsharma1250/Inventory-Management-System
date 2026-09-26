import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Sparkles,
  Layers,
  Edit,
  FolderPlus,
  Boxes,
} from "lucide-react"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useCreateCategory,
  checkSkuExists,
} from "@/hooks/useProducts"
import { useLocations } from "@/hooks/useLocations"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Product } from "@/types"

export const ProductsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const lowStockParam = searchParams.get("filter") === "low-stock"

  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState("all")
  const [onlyLowStock, setOnlyLowStock] = useState(lowStockParam)

  const { products, isLoading } = useProducts(search, selectedCat)
  const { categories } = useCategories()
  const { locations } = useLocations()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createCategory = useCreateCategory()

  // Product Form Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [uom, setUom] = useState("units")
  const [costPerUnit, setCostPerUnit] = useState("10.00")
  const [reorderPoint, setReorderPoint] = useState("20")
  const [barcode, setBarcode] = useState("")
  const [initialStock, setInitialStock] = useState("0")
  const [targetLocationId, setTargetLocationId] = useState("loc-main-stock")

  // Inline Category Dialog
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")

  // Live duplicate SKU validation
  const [skuStatus, setSkuStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle")
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (lowStockParam) {
      setOnlyLowStock(true)
    }
  }, [lowStockParam])

  // Live SKU duplicate check with debounce
  useEffect(() => {
    if (!sku.trim()) {
      setSkuStatus("idle")
      return
    }

    if (editingProduct && editingProduct.sku.toUpperCase() === sku.trim().toUpperCase()) {
      setSkuStatus("available")
      return
    }

    setSkuStatus("checking")
    const timer = setTimeout(async () => {
      const exists = await checkSkuExists(sku, editingProduct?.id)
      setSkuStatus(exists ? "duplicate" : "available")
    }, 350)

    return () => clearTimeout(timer)
  }, [sku, editingProduct])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setName("")
    setSku("")
    setCategoryId(categories[0]?.id || "cat-raw")
    setUom("units")
    setCostPerUnit("15.00")
    setReorderPoint("25")
    setBarcode("")
    setInitialStock("50")
    setTargetLocationId(locations[0]?.id || "loc-main-stock")
    setSkuStatus("idle")
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.sku)
    setCategoryId(p.categoryId)
    setUom(p.uom)
    setCostPerUnit(String(p.costPerUnit))
    setReorderPoint(String(p.reorderPoint))
    setBarcode(p.barcode || "")
    setInitialStock("0") // not editable on edit
    setSkuStatus("available")
    setFormError(null)
    setModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (skuStatus === "duplicate") {
      setFormError(`SKU "${sku}" is already in use by another product master.`)
      return
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name,
          sku: sku.toUpperCase().trim(),
          categoryId,
          uom,
          costPerUnit: Number(costPerUnit) || 0,
          reorderPoint: Number(reorderPoint) || 0,
          barcode: barcode.trim() || undefined,
        })
      } else {
        await createProduct.mutateAsync({
          name,
          sku: sku.toUpperCase().trim(),
          categoryId,
          uom,
          costPerUnit: Number(costPerUnit) || 0,
          reorderPoint: Number(reorderPoint) || 0,
          barcode: barcode.trim() || undefined,
          initialStock: Number(initialStock) || 0,
          locationId: targetLocationId,
        })
      }
      setModalOpen(false)
    } catch (err: any) {
      setFormError(err?.message || "Failed to save product")
    }
  }

  const handleCreateCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const created = await createCategory.mutateAsync({
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
    })
    setCategoryId(created.id)
    setCatModalOpen(false)
    setNewCatName("")
    setNewCatDesc("")
  }

  const displayedProducts = products.filter((p) => {
    if (!onlyLowStock) return true
    return p.lowStock === true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Product Master</h1>
              <p className="text-xs text-zinc-400">
                Item master catalog, SKU codes, categories, and automated replenishment thresholds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/scan")}
            variant="outline"
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-200 gap-1.5"
          >
            <Barcode className="h-4 w-4 text-[#FF5A36]" />
            Scan Barcode
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5 text-xs shadow-md shadow-[#FF5A36]/20 font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by Product Name, SKU, or Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-48 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-[#FF5A36] focus:outline-none h-9"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant={onlyLowStock ? "default" : "outline"}
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={
              onlyLowStock
                ? "bg-amber-600 hover:bg-amber-500 text-white text-xs h-9"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white text-xs h-9"
            }
          >
            Low Stock Only
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800/80 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#FF5A36]" />
              Product Catalog ({displayedProducts.length})
            </CardTitle>
            <span className="text-xs text-zinc-500 font-mono">
              Live duplicate SKU check active
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-300 font-semibold">SKU / Code</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Name</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Category</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">Cost</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right">Reorder Point</TableHead>
                <TableHead className="text-zinc-300 font-semibold">Barcode</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                <TableHead className="text-right text-zinc-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                    No products found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                displayedProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId)
                  return (
                    <TableRow key={p.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell>
                        <Badge className="bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/30 font-mono font-semibold">
                          {p.sku}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-200">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {cat?.name || "General"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">
                        ${Number(p.costPerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">
                        {p.reorderPoint} <span className="text-[10px] text-zinc-500">{p.uom}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {p.barcode ? (
                          <span className="flex items-center gap-1">
                            <Barcode className="h-3.5 w-3.5 text-zinc-500" />
                            {p.barcode}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.lowStock ? (
                          <Badge variant="warning" className="text-[10px] uppercase font-semibold">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] uppercase font-semibold">
                            Normal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(p)}
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          title="Edit Product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Form Modal (Create / Edit) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF5A36]" />
              {editingProduct ? "Edit Master Product" : "Create New Master Product"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure product details, reorder triggers, and optional initial stock.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="prodName" className="text-xs text-zinc-300">
                  Product Name *
                </Label>
                <Input
                  id="prodName"
                  required
                  placeholder="e.g. Steel Rods 10mm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              {/* SKU with Live Duplicate Check */}
              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prodSku" className="text-xs text-zinc-300">
                    SKU / Unique Code *
                  </Label>
                  <span className="text-[11px] font-mono">
                    {skuStatus === "checking" && (
                      <span className="text-zinc-500">Checking uniqueness...</span>
                    )}
                    {skuStatus === "available" && (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> SKU Available
                      </span>
                    )}
                    {skuStatus === "duplicate" && (
                      <span className="text-red-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="h-3 w-3" /> Duplicate SKU!
                      </span>
                    )}
                  </span>
                </div>
                <Input
                  id="prodSku"
                  required
                  placeholder="e.g. ROD-STL-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`bg-zinc-900 font-mono uppercase ${
                    skuStatus === "duplicate"
                      ? "border-red-600 focus-visible:ring-red-500"
                      : skuStatus === "available"
                      ? "border-emerald-600 focus-visible:ring-emerald-500"
                      : "border-zinc-800"
                  }`}
                />
              </div>

              {/* Category with Inline Add Button */}
              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prodCat" className="text-xs text-zinc-300">
                    Category *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(true)}
                    className="text-[11px] text-[#FF5A36] hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="h-3 w-3" />
                    + Add New Category
                  </button>
                </div>
                <select
                  id="prodCat"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodUom" className="text-xs text-zinc-300">
                  Unit of Measure (UoM) *
                </Label>
                <select
                  id="prodUom"
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
                >
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="boxes">boxes</option>
                  <option value="sheets">sheets</option>
                  <option value="meters">meters</option>
                  <option value="rolls">rolls</option>
                  <option value="liters">liters</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodCost" className="text-xs text-zinc-300">
                  Cost per Unit ($)
                </Label>
                <Input
                  id="prodCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodReorder" className="text-xs text-zinc-300">
                  Reorder Threshold Point
                </Label>
                <Input
                  id="prodReorder"
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodBarcode" className="text-xs text-zinc-300">
                  Barcode Number (UPC/EAN)
                </Label>
                <Input
                  id="prodBarcode"
                  placeholder="e.g. 890123456789"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                />
              </div>

              {/* Optional Initial Stock on creation */}
              {!editingProduct && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="initialStock" className="text-xs text-zinc-300">
                      Initial Stock (Optional)
                    </Label>
                    <Input
                      id="initialStock"
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="initLocation" className="text-xs text-zinc-300">
                      Initial Storage Location
                    </Label>
                    <select
                      id="initLocation"
                      value={targetLocationId}
                      onChange={(e) => setTargetLocationId(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-[#FF5A36] focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.shortCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={skuStatus === "duplicate" || createProduct.isPending || updateProduct.isPending}
                className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 disabled:opacity-40"
              >
                {editingProduct ? "Update Product" : "Save Product Master"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Create Category Dialog */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Add New Category</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Create a custom classification tag for inventory items.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategoryInline} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="catName" className="text-xs text-zinc-300">
                Category Name *
              </Label>
              <Input
                id="catName"
                required
                placeholder="e.g. Electrical Components"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catDesc" className="text-xs text-zinc-300">
                Description (Optional)
              </Label>
              <Input
                id="catDesc"
                placeholder="Wiring, breakers, and conduits"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCatModalOpen(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 text-xs">
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductsListPage
