import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowDownToLine,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Check,
  Ban,
  Printer,
  ShieldCheck,
  User,
  Package,
} from "lucide-react"
import { useReceipt, useValidateReceipt, useCancelReceipt, useUpdateReceipt } from "@/hooks/useReceipts"
import { useProducts } from "@/hooks/useProducts"
import { useLocations } from "@/hooks/useLocations"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DocStatus, OrderLineItem } from "@/types"

export const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const receipt = useReceipt(id)
  const { user } = useAuth()

  const validateMutation = useValidateReceipt()
  const cancelMutation = useCancelReceipt()
  const updateMutation = useUpdateReceipt()
  const { allProducts } = useProducts()
  const { locations } = useLocations()

  // Header Editable Fields
  const [from, setFrom] = useState(receipt?.from || "vendor")
  const [responsible, setResponsible] = useState(
    user?.displayName || user?.email?.split("@")[0] || "Manager User"
  )
  const [scheduledDate, setScheduledDate] = useState(receipt?.scheduledDate || "")
  const [lines, setLines] = useState<OrderLineItem[]>(receipt?.lines || [])

  // Add line draft
  const [selectedProductId, setSelectedProductId] = useState(allProducts[0]?.id || "prod-desk")
  const [newQty, setNewQty] = useState("6")
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  useEffect(() => {
    if (receipt) {
      setFrom(receipt.from)
      setScheduledDate(receipt.scheduledDate)
      setLines(receipt.lines || [])
    }
    if (user) {
      setResponsible(user.displayName || user.email?.split("@")[0] || "Manager User")
    }
  }, [receipt, user])

  if (!receipt) {
    return (
      <div className="space-y-6">
        <Link to="/receipts" className="text-xs text-[#FF5A36] hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Receipts
        </Link>
        <Card className="border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
          Receipt voucher not found.
        </Card>
      </div>
    )
  }

  const isDone = receipt.status === "done"
  const isCancelled = receipt.status === "cancelled"
  const isReady = receipt.status === "ready"
  const isDraft = receipt.status === "draft"
  const isEditable = !isDone && !isCancelled

  const handleAddLine = () => {
    if (!isEditable) return
    const prod = allProducts.find((p) => p.id === selectedProductId)
    if (!prod) return

    const qty = Number(newQty) || 1
    const existingIndex = lines.findIndex((l) => l.productId === selectedProductId)

    let updatedLines: OrderLineItem[]
    if (existingIndex >= 0) {
      updatedLines = lines.map((l, i) =>
        i === existingIndex ? { ...l, quantity: l.quantity + qty } : l
      )
    } else {
      updatedLines = [
        ...lines,
        {
          productId: prod.id,
          quantity: qty,
          productName: prod.name,
          sku: prod.sku,
          uom: prod.uom,
        },
      ]
    }

    setLines(updatedLines)
    updateMutation.mutate({ id: receipt.id, lines: updatedLines })
  }

  const handleRemoveLine = (index: number) => {
    if (!isEditable) return
    const updated = lines.filter((_, i) => i !== index)
    setLines(updated)
    updateMutation.mutate({ id: receipt.id, lines: updated })
  }

  const handleUpdateLineQty = (index: number, newQuantity: number) => {
    if (!isEditable) return
    const updated = lines.map((l, i) =>
      i === index ? { ...l, quantity: Math.max(1, newQuantity) } : l
    )
    setLines(updated)
    updateMutation.mutate({ id: receipt.id, lines: updated })
  }

  // Workflow transitions matching wireframe Image 1:
  // "To DO = When in Draft, Validate = When in Ready. On click, TODO, move to Ready. on click, Validate move to Done"
  const handleActionClick = async () => {
    try {
      if (isDraft) {
        await updateMutation.mutateAsync({ id: receipt.id, status: "ready" })
        setFeedbackMsg("Status moved to Ready. Document staged for validation.")
      } else if (isReady) {
        await validateMutation.mutateAsync(receipt.id)
        setFeedbackMsg("✓ Receipt validated successfully! Inbound quantities incremented in stock.")
      }
    } catch (err: any) {
      setFeedbackMsg(`Action failed: ${err.message}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this inbound receipt?")) {
      await cancelMutation.mutateAsync(receipt.id)
    }
  }

  // Stepper from wireframe: Draft > Ready > Done
  const stepperStates = ["draft", "ready", "done"]
  const getStepIndex = (st: string) => {
    if (st === "draft") return 0
    if (st === "waiting" || st === "ready") return 1
    if (st === "done") return 2
    return -1
  }
  const currentStep = getStepIndex(receipt.status)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/receipts"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Button
              size="sm"
              onClick={() => navigate("/receipts")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
            >
              New
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Receipt
            </h1>
          </div>

          {/* Stepper on top right matching wireframe: Draft > Ready > Done */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono">
            {["Draft", "Ready", "Done"].map((step, idx) => {
              const active = currentStep >= idx
              const isCurrent = currentStep === idx
              return (
                <React.Fragment key={step}>
                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? "text-[#FF5A36]"
                        : active
                        ? "text-white"
                        : "text-zinc-600"
                    }`}
                  >
                    {step}
                  </span>
                  {idx < 2 && <span className="mx-2 text-zinc-600">&gt;</span>}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Action Buttons: [Validate / To DO] [Print] [Cancel] */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            {isDraft && (
              <Button
                size="sm"
                onClick={handleActionClick}
                disabled={updateMutation.isPending}
                className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold text-xs px-4"
              >
                TODO (Move to Ready)
              </Button>
            )}

            {isReady && (
              <Button
                size="sm"
                onClick={handleActionClick}
                disabled={validateMutation.isPending}
                className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold text-xs px-4 gap-1.5 shadow-md shadow-[#FF5A36]/20"
              >
                <Check className="h-3.5 w-3.5" />
                Validate
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-zinc-400" />
              Print
            </Button>

            {isEditable && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="border-zinc-800 bg-zinc-900/40 hover:bg-red-950/40 hover:border-red-800 hover:text-red-300 text-zinc-400 text-xs"
              >
                Cancel
              </Button>
            )}
          </div>

          <Badge
            variant="outline"
            className={`font-mono text-xs uppercase px-2.5 py-1 ${
              isDone
                ? "border-emerald-700 bg-emerald-950/40 text-emerald-400"
                : isCancelled
                ? "border-red-700 bg-red-950/40 text-red-400"
                : "border-sky-700 bg-sky-950/40 text-sky-400"
            }`}
          >
            {receipt.status}
          </Badge>
        </div>
      </div>

      {/* Done Confirmation Banner */}
      {isDone && (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3.5 text-xs text-emerald-300 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-200">Receipt Completed & Locked</p>
            <p className="text-emerald-400/80">
              Inventory was received into stock. Ledger entries created. Click "Print" to print warehouse docket.
            </p>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-200">
          {feedbackMsg}
        </div>
      )}

      {/* Main Document Body */}
      <Card className="border-zinc-800 bg-zinc-950/80 p-6 shadow-xl space-y-6">
        {/* Reference Number */}
        <div>
          <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight">
            {receipt.reference}
          </h2>
        </div>

        {/* Header Fields Grid matching Wireframe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 font-medium">Receive From</Label>
              <Input
                disabled={!isEditable}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onBlur={() => isEditable && updateMutation.mutate({ id: receipt.id, from })}
                placeholder="vendor supplier"
                className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 font-medium flex items-center justify-between">
                <span>Responsible</span>
                <span className="text-[10px] text-zinc-500 font-mono">* Logged-in user</span>
              </Label>
              <Input
                disabled
                value={responsible}
                className="bg-zinc-900/60 border-zinc-800 text-zinc-300"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 font-medium">Schedule Date</Label>
              <Input
                type="date"
                disabled={!isEditable}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                onBlur={() => isEditable && updateMutation.mutate({ id: receipt.id, scheduledDate })}
                className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 font-medium">Destination</Label>
              <Input
                disabled
                value={receipt.to}
                className="bg-zinc-900/60 border-zinc-800 text-zinc-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="border-t border-zinc-800/80 pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Products
          </h3>

          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-300 font-semibold">Product</TableHead>
                <TableHead className="text-zinc-300 font-semibold text-right w-36">Quantity</TableHead>
                {isEditable && <TableHead className="text-right w-16">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-zinc-500">
                    No products added to this receipt yet.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, idx) => (
                  <TableRow key={`${line.productId}_${idx}`} className="border-zinc-800/60">
                    <TableCell className="font-semibold text-zinc-200">
                      <span className="font-mono text-zinc-400 mr-2">[{line.sku}]</span>
                      <span>{line.productName}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditable ? (
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateLineQty(idx, Number(e.target.value) || 1)}
                          className="w-24 text-right bg-zinc-900 border-zinc-800 text-white font-mono text-xs ml-auto"
                        />
                      ) : (
                        <span className="font-mono font-bold text-white text-base">
                          {line.quantity}
                        </span>
                      )}
                    </TableCell>
                    {isEditable && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* New Product Line / Add Line Button */}
          {isEditable && (
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-28">
                <Input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Qty"
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs h-9"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddLine}
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white text-xs gap-1.5 h-9 shrink-0 font-medium"
              >
                <Plus className="h-3.5 w-3.5 text-[#FF5A36]" />
                New Product
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ReceiptDetailPage
