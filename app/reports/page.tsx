"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, DollarSign, TrendingUp, Download, Loader2 } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { invoicesApi, type Invoice } from "@/lib/api/invoices"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { clientsApi, type Client } from "@/lib/api/clients"
import { toast } from "sonner"

export default function ReportsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string>("all")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadInvoices()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterInvoices()
  }, [invoices, dateRange, statusFilter])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const data = await invoicesApi.getAll()
      const itemsData = await itemsApi.getAll()
      const clientsData = await clientsApi.getAll()
      setInvoices(data)
      setItems(itemsData)
      setClients(clientsData)
    } catch (error: any) {
      toast.error("Failed to load invoices: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    // Filter by date range
    filtered = filtered.filter((inv) => {
      const invDate = new Date(inv.date)
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)
      return invDate >= start && invDate <= end
    })

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const calculateStats = () => {
    const totalRevenue = filteredInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0)
    
    const totalInvoices = filteredInvoices.length
    const paidInvoices = filteredInvoices.filter((inv) => inv.status === "paid").length
    const pendingInvoices = filteredInvoices.filter((inv) => inv.status === "pending").length

    return {
      totalRevenue,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
    }
  }

  const getProductSummary = () => {
    const soldByItemId = new Map<string, number>()
    for (const inv of filteredInvoices) {
      for (const line of inv.items || []) {
        const itemId = String(line.item_id || "")
        if (!itemId) continue
        const qty = Number(line.quantity) || 0
        soldByItemId.set(itemId, (soldByItemId.get(itemId) || 0) + qty)
      }
    }

    return items
      .map((item) => ({
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        unit_price: Number(item.unit_price) || 0,
        sold_quantity: soldByItemId.get(item.id) || 0,
        remained_quantity: Number(item.quantity) || 0,
      }))
      .sort((a, b) => b.sold_quantity - a.sold_quantity)
  }

  const getCustomerSummary = () => {
    if (selectedClientId === "all") {
      return {
        paidBills: 0,
        creditBills: 0,
        totalCreditAmount: 0,
        invoices: [] as Invoice[],
      }
    }

    const clientInvoices = invoices
      .filter((inv) => inv.client_id === selectedClientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const paidBills = clientInvoices.filter((inv) => inv.status === "paid").length
    const creditInvoices = clientInvoices.filter((inv) => inv.status === "credit")
    const totalCreditAmount = creditInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)

    return {
      paidBills,
      creditBills: creditInvoices.length,
      totalCreditAmount,
      invoices: clientInvoices,
    }
  }

  const exportToCSV = () => {
    const headers = ["Invoice Number", "Date", "Client", "Subtotal", "Discount", "Tax", "Total", "Status"]
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      new Date(inv.date).toLocaleDateString(),
      inv.client_name || "N/A",
      `Rs. ${inv.subtotal.toFixed(2)}`,
      `Rs. ${inv.discount.toFixed(2)}`,
      `Rs. ${inv.tax.toFixed(2)}`,
      `Rs. ${inv.total.toFixed(2)}`,
      inv.status,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices_report_${dateRange.start}_to_${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Report exported successfully!")
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const stats = calculateStats()
  const productSummary = getProductSummary()
  const customerSummary = getCustomerSummary()

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground">Sales and invoice analytics</p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidInvoices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>{filteredInvoices.length} invoices found</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices found for selected filters</p>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client_name} • {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {invoice.total.toFixed(2)}</p>
                      <p className={`text-xs ${
                        invoice.status === "paid" ? "text-green-600" :
                        invoice.status === "pending" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Product Summary</CardTitle>
            <CardDescription>
              Item code, name, price, sold quantity, and remaining quantity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productSummary.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No product data found</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2 rounded-lg border bg-zinc-50 p-2 text-sm font-semibold">
                  <p>Item Code</p>
                  <p>Item Name</p>
                  <p className="text-right">Price</p>
                  <p className="text-right">Sold Qty</p>
                  <p className="text-right">Remain Qty</p>
                </div>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {productSummary.map((row) => (
                    <div key={row.id} className="grid grid-cols-5 gap-2 rounded-lg border p-2 text-sm">
                      <p>{row.item_code}</p>
                      <p>{row.item_name}</p>
                      <p className="text-right">Rs. {row.unit_price.toFixed(2)}</p>
                      <p className="text-right">{row.sold_quantity}</p>
                      <p className="text-right">{row.remained_quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Summary</CardTitle>
            <CardDescription>
              Paid bills, credit bills, total credit amount, and all invoices of the selected customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select customer</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.client_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId !== "all" ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Paid Bills</p>
                    <p className="text-2xl font-semibold">{customerSummary.paidBills}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Credit Bills</p>
                    <p className="text-2xl font-semibold">{customerSummary.creditBills}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Total Credit Amount</p>
                    <p className="text-2xl font-semibold">Rs. {customerSummary.totalCreditAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">All Invoices</p>
                  {customerSummary.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices found for this customer.</p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {customerSummary.invoices.map((invoice) => (
                        <div key={invoice.id} className="grid grid-cols-4 gap-2 rounded-lg border p-2 text-sm">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p>{new Date(invoice.date).toLocaleDateString()}</p>
                          <p className="capitalize">{invoice.status}</p>
                          <p className="text-right font-medium">Rs. {Number(invoice.total || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a customer to view summary.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

