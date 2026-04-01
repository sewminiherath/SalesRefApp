"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List, LogOut, Loader2, Home, BarChart3, FileText, Settings } from "lucide-react"
import { CreateInvoiceForm } from "@/components/create-invoice-form"
import { InvoiceList } from "@/components/invoice-list"
import { BackButton } from "@/components/ui/back-button"

export default function InvoicesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<"create" | "list">("create")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
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
            <div>
              <h1 className="text-2xl font-bold">E-Billing</h1>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-12 w-12">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-t">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Home className="h-4 w-4 mx-auto mb-1" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 px-2 py-3 text-center font-medium transition-colors text-xs ${
              activeTab === "create"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Plus className="h-4 w-4 mx-auto mb-1" />
            Create
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 px-2 py-3 text-center font-medium transition-colors text-xs ${
              activeTab === "list"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            <List className="h-4 w-4 mx-auto mb-1" />
            Invoices
          </button>
          <button
            onClick={() => router.push("/quotations")}
            className="flex-1 px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Quotes
          </button>
          <button
            onClick={() => router.push("/reports")}
            className="flex-1 px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <BarChart3 className="h-4 w-4 mx-auto mb-1" />
            Reports
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="flex-1 px-2 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-primary text-xs"
          >
            <Settings className="h-4 w-4 mx-auto mb-1" />
            Settings
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-8">
        {activeTab === "create" ? <CreateInvoiceForm /> : <InvoiceList />}
      </main>
    </div>
  )
}

