"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, FileText, TrendingUp, Package, Loader2, Plus, List, LogOut, BarChart3, Settings, Users } from "lucide-react"
import { invoicesApi, type Invoice } from "@/lib/api/invoices"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const invoices = await invoicesApi.getAll()
      
      const totalRevenue = invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.total, 0)
      
      const totalInvoices = invoices.length
      const pendingInvoices = invoices.filter((inv) => inv.status === "pending").length
      const paidInvoices = invoices.filter((inv) => inv.status === "paid").length
      
      setStats({
        totalRevenue,
        totalInvoices,
        pendingInvoices,
        paidInvoices,
      })
      
      setRecentInvoices(invoices.slice(0, 5))
    } catch (error: any) {
      toast.error("Failed to load dashboard data: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
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

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/login" />
            <div>
              <h1 className="text-2xl font-bold">E-Billing</h1>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-12 w-12">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t overflow-x-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors border-b-2 border-primary text-primary text-xs"
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Dashboard
          </button>
          <button
            onClick={() => router.push("/invoices")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Plus className="h-4 w-4 mx-auto mb-1" />
            Create
          </button>
          <button
            onClick={() => router.push("/invoices?tab=list")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <List className="h-4 w-4 mx-auto mb-1" />
            Invoices
          </button>
          <button
            onClick={() => router.push("/reports")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <BarChart3 className="h-4 w-4 mx-auto mb-1" />
            Reports
          </button>
          <button
            onClick={() => router.push("/products")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Package className="h-4 w-4 mx-auto mb-1" />
            Products
          </button>
          <button
            onClick={() => router.push("/customers")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Users className="h-4 w-4 mx-auto mb-1" />
            Customers
          </button>
          <button
            onClick={() => router.push("/quotations")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Quotes
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Settings className="h-4 w-4 mx-auto mb-1" />
            Settings
          </button>
        </div>
      </header>

      <div className="p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your billing system</p>
            </div>
            <Button onClick={() => router.push("/invoices")} size="lg" className="h-12">
              <Plus className="h-5 w-5 mr-2" />
              Create Invoice
            </Button>
          </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidInvoices}</div>
              <p className="text-xs text-muted-foreground">Completed payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest 5 invoices created</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-100 transition-colors"
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
    </div>
  )
}

