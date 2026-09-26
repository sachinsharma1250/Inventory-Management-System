import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser"
import {
  Camera,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Package,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react"
import { getProductByBarcode, useCreateProduct, useCategories } from "@/hooks/useProducts"
import { useLocations } from "@/hooks/useLocations"
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
import type { Product } from "@/types"

export const BarcodeScanPage: React.FC = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Quick Create Dialog state for unregistered barcodes
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSku, setNewSku] = useState("")
  const [newCatId, setNewCatId] = useState("")
  const [newUom, setNewUom] = useState("units")
  const [newCost, setNewCost] = useState("20.00")
  const [newReorder, setNewReorder] = useState("15")
  const [newInitialStock, setNewInitialStock] = useState("40")

  const { categories } = useCategories()
  const { locations } = useLocations()
  const createProduct = useCreateProduct()

  // Start webcam with @zxing/browser
  const startCamera = async () => {
    setCameraError(null)
    if (!videoRef.current) return

    try {
      const codeReader = new BrowserMultiFormatReader()
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setCameraError("No camera hardware detected on this device. You can test barcode decoding using the on-screen simulated barcodes below.")
        setCameraActive(false)
        return
      }

      const selectedDeviceId = videoInputDevices[0].deviceId

      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            handleCodeScanned(result.getText())
          }
        }
      )

      controlsRef.current = controls
      setCameraActive(true)
    } catch (err: any) {
      console.warn("Webcam stream initialization failed:", err)
      setCameraError(
        "Camera Permission Denied: StockSense requires camera access to scan 1D barcodes and QR codes on goods. Please enable camera access in your browser bar, or use the instant test buttons below."
      )
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
      } catch {}
      controlsRef.current = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  // Process scanned code
  const handleCodeScanned = async (code: string) => {
    const cleanCode = code.trim()
    if (!cleanCode || cleanCode === lastScannedCode) return

    setLastScannedCode(cleanCode)
    setIsSearching(true)

    try {
      const found = await getProductByBarcode(cleanCode)
      setMatchedProduct(found)

      if (!found) {
        // Pre-fill modal state for registering new item
        setNewSku(`SKU-${cleanCode.substring(cleanCode.length - 4)}`)
        setNewName(`Scanned Item #${cleanCode}`)
        setNewCatId(categories[0]?.id || "cat-raw")
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleCreateWithScannedBarcode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lastScannedCode) return

    const product = await createProduct.mutateAsync({
      name: newName,
      sku: newSku.toUpperCase().trim(),
      categoryId: newCatId,
      uom: newUom,
      costPerUnit: Number(newCost) || 0,
      reorderPoint: Number(newReorder) || 0,
      barcode: lastScannedCode,
      initialStock: Number(newInitialStock) || 0,
      locationId: locations[0]?.id || "loc-main-stock",
    })

    setMatchedProduct(product)
    setModalOpen(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Barcode & QR Scanner</h1>
              <p className="text-xs text-zinc-400">
                Optical camera recognition powered by <code className="text-zinc-300 font-mono">@zxing/browser</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive ? (
            <Button size="sm" variant="outline" onClick={stopCamera} className="border-zinc-800 text-xs">
              Pause Camera
            </Button>
          ) : (
            <Button size="sm" onClick={startCamera} className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Start Scanner
            </Button>
          )}
        </div>
      </div>

      {/* Main Scanner Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Viewfinder Box */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-zinc-800 bg-black overflow-hidden relative shadow-2xl">
            <div className="relative aspect-[4/3] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {/* Webcam Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Laser Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-64 h-48 rounded-xl border-2 border-[#FF5A36]/70 shadow-[0_0_20px_rgba(255,90,54,0.35)]">
                  {/* Corner Guides */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />

                  {/* Animated Scanning Laser Line */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent animate-pulse" />
                </div>
              </div>

              {/* Active Scanner Status Badge */}
              <div className="absolute top-3 left-3">
                <Badge
                  variant="outline"
                  className={
                    cameraActive
                      ? "border-emerald-700/80 bg-black/70 text-emerald-400 font-mono text-[10px]"
                      : "border-zinc-700 bg-black/70 text-zinc-400 font-mono text-[10px]"
                  }
                >
                  {cameraActive ? "● Scanner Active" : "○ Stream Paused"}
                </Badge>
              </div>
            </div>

            {/* Camera Rationale Alert if Denied/Unavailable */}
            {cameraError && (
              <div className="p-4 border-t border-red-900/60 bg-red-950/30 text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-200">Camera Notice</p>
                  <p className="text-red-300/90 leading-relaxed">{cameraError}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Simulation Tools for Instant Roundtrip Testing */}
          <Card className="border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FF5A36]" />
                Simulate Barcode Scan (Round Trip Testing)
              </span>
              <span className="text-[10px] text-zinc-500">Instant test</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Click any barcode below to simulate instant optical scanning and test matching:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCodeScanned("890123456789")}
                className="border-zinc-800 bg-zinc-900 hover:bg-[#FF5A36]/15 hover:border-[#FF5A36]/40 text-xs font-mono"
              >
                890123456789 (Steel Rods)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCodeScanned("890123456790")}
                className="border-zinc-800 bg-zinc-900 hover:bg-[#FF5A36]/15 hover:border-[#FF5A36]/40 text-xs font-mono"
              >
                890123456790 (Chairs)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCodeScanned("890999888777")}
                className="border-zinc-800 bg-zinc-900 hover:bg-amber-950/40 hover:border-amber-700/60 text-xs font-mono text-amber-300"
              >
                890999888777 (New Unregistered Code)
              </Button>
            </div>
          </Card>
        </div>

        {/* Scan Results Panel */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-zinc-800 bg-zinc-950/90 shadow-xl h-full flex flex-col">
            <CardHeader className="border-b border-zinc-800/80 pb-3">
              <CardTitle className="text-base text-zinc-100 flex items-center justify-between">
                <span>Scan Result</span>
                {lastScannedCode && (
                  <Badge variant="outline" className="border-zinc-800 font-mono text-xs text-[#FF5A36]">
                    {lastScannedCode}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                {isSearching
                  ? "Looking up product in database..."
                  : lastScannedCode
                  ? "Barcode decoded successfully"
                  : "Point camera at item barcode"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 flex-1 flex flex-col justify-center">
              {!lastScannedCode ? (
                <div className="text-center py-10 space-y-2">
                  <Barcode className="h-10 w-10 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">
                    Awaiting camera stream or barcode trigger
                  </p>
                </div>
              ) : matchedProduct ? (
                /* Found Product in Catalog */
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="success" className="text-[10px] gap-1 font-semibold uppercase">
                        <CheckCircle2 className="h-3 w-3" /> Matched Item
                      </Badge>
                      <span className="text-xs font-mono text-zinc-400">{matchedProduct.sku}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white pt-1">{matchedProduct.name}</h3>
                    <p className="text-xs text-zinc-400">
                      Standard Cost: <strong className="text-zinc-200 font-mono">${matchedProduct.costPerUnit.toFixed(2)}</strong> / {matchedProduct.uom}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => navigate("/stock")}
                      className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs gap-2 font-semibold shadow-md shadow-[#FF5A36]/20"
                    >
                      <Layers className="h-4 w-4" />
                      View Live Stock Availability
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => navigate(`/adjustments/new?productId=${matchedProduct.id}`)}
                      className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-[#FF5A36]" />
                      Initiate Stock Adjustment
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setLastScannedCode(null)}
                      className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Clear & Scan Next
                    </Button>
                  </div>
                </div>
              ) : (
                /* Barcode Not Found -> Pre-fill Option */
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Unregistered Barcode</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Barcode <code className="font-mono text-[#FF5A36]">{lastScannedCode}</code> is not yet linked to any product record.
                    </p>
                  </div>

                  <Button
                    onClick={() => setModalOpen(true)}
                    className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs gap-2 font-semibold shadow-md shadow-[#FF5A36]/20"
                  >
                    <Plus className="h-4 w-4" />
                    Pre-fill New Product Form
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setLastScannedCode(null)}
                    className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    Reset & Scan Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pre-filled Product Registration Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF5A36]" />
              Register Scanned Product
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Pre-filled with barcode <code className="text-[#FF5A36] font-mono">{lastScannedCode}</code>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWithScannedBarcode} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Product Name *</Label>
              <Input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">SKU Code *</Label>
                <Input
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Category</Label>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Unit of Measure</Label>
                <select
                  value={newUom}
                  onChange={(e) => setNewUom(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="boxes">boxes</option>
                  <option value="rolls">rolls</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Initial Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newInitialStock}
                  onChange={(e) => setNewInitialStock(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 text-xs">
                Save & Link Barcode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BarcodeScanPage
