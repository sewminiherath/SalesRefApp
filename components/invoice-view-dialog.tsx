"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail } from "lucide-react"
import { invoicesApi, type Invoice } from "@/lib/api/invoices"
import { toast } from "sonner"
import { useState } from "react"

interface InvoiceViewDialogProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toMoney(value: unknown): string {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

export function InvoiceViewDialog({ invoice, open, onOpenChange }: InvoiceViewDialogProps) {
  const [emailRecipient, setEmailRecipient] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  if (!invoice) return null

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true)
      const result = await invoicesApi.sendEmail(invoice.id, emailRecipient || undefined)
      toast.success(`Invoice email sent to ${result.sent_to}`)
    } catch (error: any) {
      toast.error("Failed to send invoice email: " + (error.message || "Unknown error"))
    } finally {
      setIsSendingEmail(false)
    }
  }

  const getStatusBadge = (status: Invoice["status"]) => {
    const base =
      "rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold text-white shadow-none"
    switch (status) {
      case "paid":
        return (
          <Badge className={`${base} bg-emerald-600 hover:bg-emerald-600`}>Paid</Badge>
        )
      case "credit":
        return (
          <Badge className={`${base} bg-blue-600 hover:bg-blue-600`}>Credit</Badge>
        )
      case "pending":
        return (
          <Badge className={`${base} bg-amber-500 hover:bg-amber-500`}>Pending</Badge>
        )
      case "overdue":
        return (
          <Badge className={`${base} bg-red-600 hover:bg-red-600`}>Overdue</Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-zinc-900">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
              <DialogDescription>Complete invoice information</DialogDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-600">Invoice Number</p>
              <p className="text-lg font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Date</p>
              <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Client</p>
              <p className="font-medium">{invoice.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Total Amount</p>
              <p className="text-lg font-semibold">Rs. {toMoney(invoice.total)}</p>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Line Items</h3>
            <div className="space-y-2">
              {invoice.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{item.item_name}</p>
                    <p className="text-sm text-zinc-600">
                      Rs. {toMoney(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-900">Rs. {toMoney(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal:</span>
              <span className="font-medium text-zinc-900">Rs. {toMoney(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Discount:</span>
              <span className="font-medium text-red-600">-Rs. {toMoney(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Tax:</span>
              <span className="font-medium text-zinc-900">Rs. {toMoney(invoice.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-zinc-900">Grand Total:</span>
              <span className="font-bold text-zinc-900">Rs. {toMoney(invoice.total)}</span>
            </div>
          </div>

          {/* Email Invoice */}
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
            <p className="font-semibold text-zinc-900">Email Invoice</p>
            <p className="text-sm text-zinc-600">
              Enter company email (optional). If empty, server default email will be used.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="company@example.com"
                className="h-10"
              />
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="h-10"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

