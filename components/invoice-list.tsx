"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Eye, Loader2, Mail, Trash2 } from "lucide-react"
import { invoicesApi, type Invoice } from "@/lib/api/invoices"
import { toast } from "sonner"
import { InvoiceViewDialog } from "@/components/invoice-view-dialog"

function toMoney(value: unknown): string {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const data = await invoicesApi.getAll()
      setInvoices(data)
    } catch (error: any) {
      toast.error("Failed to load invoices: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (searchTerm) {
      return (
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  const handleSendSavedInvoice = async (invoice: Invoice) => {
    try {
      setSendingInvoiceId(invoice.id)
      const result = await invoicesApi.sendEmail(invoice.id)
      toast.success(`Invoice ${invoice.invoice_number} emailed to ${result.sent_to}`)
    } catch (error: any) {
      toast.error(
        `Failed to send ${invoice.invoice_number}: ` + (error.message || "Unknown error")
      )
    } finally {
      setSendingInvoiceId(null)
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoice_number}? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      setDeletingInvoiceId(invoice.id)
      await invoicesApi.remove(invoice.id)
      setInvoices((prev) => prev.filter((i) => i.id !== invoice.id))
      if (viewingInvoice?.id === invoice.id) {
        setViewingInvoice(null)
      }
      toast.success(`Invoice ${invoice.invoice_number} deleted`)
    } catch (error: any) {
      toast.error(
        `Failed to delete ${invoice.invoice_number}: ` + (error.message || "Unknown error")
      )
    } finally {
      setDeletingInvoiceId(null)
    }
  }

  const getStatusBadge = (status: Invoice["status"]) => {
    const base =
      "shrink-0 rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold text-white shadow-none"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
            All Invoices
          </CardTitle>
          <CardDescription className="text-zinc-500">
            View and manage invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-gray-200 bg-white pl-10 text-base text-zinc-900 placeholder:text-zinc-400 shadow-none"
            />
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:border-gray-300 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-zinc-900">
                        {invoice.invoice_number}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm font-medium text-zinc-900">{invoice.client_name}</p>
                    <p className="text-sm text-zinc-600">
                      {new Date(invoice.date).toLocaleDateString()} • Rs. {toMoney(invoice.total)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSendSavedInvoice(invoice)}
                      disabled={sendingInvoiceId === invoice.id}
                      className="h-12 border-gray-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      {sendingInvoiceId === invoice.id ? (
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewingInvoice(invoice)}
                      className="h-12 w-12 border-gray-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteInvoice(invoice)}
                      disabled={deletingInvoiceId === invoice.id}
                      className="h-12 w-12 border-gray-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      {deletingInvoiceId === invoice.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceViewDialog
        invoice={viewingInvoice}
        open={viewingInvoice !== null}
        onOpenChange={() => setViewingInvoice(null)}
      />
    </div>
  )
}

