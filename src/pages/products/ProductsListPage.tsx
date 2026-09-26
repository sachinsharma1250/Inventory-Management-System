import React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Plus } from "lucide-react"

// TODO: [Team Member 2] Implement Product Management & Catalog Table
// - Products list with SKU, name, category, UoM, cost, reorder point
// - Filter by Category and Search by SKU / Name
// - Dialog to create new product with initial stock
// - Link to Product Detail (/products/:id)

export const ProductsListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-[#FF5A36]" />
            Products Catalog
          </h1>
          <p className="text-sm text-zinc-400">
            Manage your inventory SKU master records, categories, and reorder levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400">
            Route: /products
          </Badge>
          <Button size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Scaffold Stub Ready</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-xs">
            Assigned Track: Member 2 (Products & Catalog)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p className="font-mono text-xs text-zinc-500">
            // TODO: Implement Table using shadcn/ui Table component and TanStack Query on `productsCol`.
          </p>
          <div className="flex gap-2">
            <Link to="/products/demo-123" className="text-xs text-[#FF5A36] hover:underline">
              Test detail route: /products/demo-123 →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default ProductsListPage
