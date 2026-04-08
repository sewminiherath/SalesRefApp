"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import type { Invoice } from "@/lib/api/invoices"

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
  if (!invoice) return null

  const downloadInvoicePDF = (inv: Invoice) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${inv.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .summary { float: right; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <h2>${inv.invoice_number}</h2>
          </div>
          <div class="invoice-info">
            <div>
              <p><strong>Date:</strong> ${new Date(inv.date).toLocaleDateString()}</p>
              <p><strong>Client:</strong> ${inv.client_name || "N/A"}</p>
            </div>
            <div>
              <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items.map((item: any) => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${toMoney(item.unit_price)}</td>
                  <td>Rs. ${toMoney(item.total)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>Rs. ${toMoney(inv.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Discount:</span>
              <span>-Rs. ${toMoney(inv.discount)}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>Rs. ${toMoney(inv.tax)}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>Rs. ${toMoney(inv.total)}</span>
            </div>
          </div>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="text-lg font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{invoice.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">Rs. {toMoney(invoice.total)}</p>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Line Items</h3>
            <div className="space-y-2">
              {invoice.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Rs. {toMoney(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">Rs. {toMoney(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 bg-muted p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">Rs. {toMoney(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium text-destructive">-Rs. {toMoney(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">Rs. {toMoney(invoice.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Grand Total:</span>
              <span className="font-bold">Rs. {toMoney(invoice.total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

