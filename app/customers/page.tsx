"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateCustomerForm } from "@/components/create-customer-form"
import { CustomerList } from "@/components/customer-list"
import { BackButton } from "@/components/ui/back-button"
import { Loader2, Users, Home, FileText, Plus, List, BarChart3, Settings, LogOut, Package } from "lucide-react"

export default function CustomersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<"add" | "list">("add")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold">Customers</h1>
                <p className="text-sm text-muted-foreground">{user?.name}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-12 w-12">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation Tabs (same style as dashboard/invoices) */}
        <div className="flex border-t overflow-x-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Home className="h-4 w-4 mx-auto mb-1" />
            Dashboard
          </button>
          <button
            onClick={() => router.push("/invoices")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Plus className="h-4 w-4 mx-auto mb-1" />
            Invoices
          </button>
          <button
            onClick={() => router.push("/quotations")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Quotes
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
            onClick={() => router.push("/settings")}
            className="flex-1 min-w-[80px] px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Settings className="h-4 w-4 mx-auto mb-1" />
            Settings
          </button>
        </div>

        {/* Local tabs for customers page */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 px-2 py-3 text-center font-medium transition-colors text-xs ${
              activeTab === "add"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Add Customer
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 px-2 py-3 text-center font-medium transition-colors text-xs ${
              activeTab === "list"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Customer List
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {activeTab === "add" ? (
            <CreateCustomerForm onCreated={() => setActiveTab("list")} />
          ) : (
            <CustomerList />
          )}
        </div>
      </main>
    </div>
  )
}


