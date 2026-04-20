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
import { toast } from "sonner"

export default function ReportsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      setInvoices(data)
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
      </div>
    </div>
  )
}

