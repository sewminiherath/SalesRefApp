"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Loader2 } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "sonner"

export default function SettingsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    companyName: "Your Company",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    currency: "USD",
    taxRate: "9",
    defaultDiscount: "0",
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("ebilling_settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Failed to load settings", e)
      }
    }
  }, [])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      localStorage.setItem("ebilling_settings", JSON.stringify(settings))
      toast.success("Settings saved successfully!")
    } catch (error: any) {
      toast.error("Failed to save settings: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-muted-foreground">Configure your E-Billing system</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading} className="h-10">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your company details for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Your Company Name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                placeholder="Company Address"
                className="h-10"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  placeholder="info@company.com"
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Settings</CardTitle>
            <CardDescription>Default values for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings({ ...settings, currency: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="LKR">LKR (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Default Discount (%)</Label>
                <Input
                  id="defaultDiscount"
                  type="number"
                  step="0.01"
                  value={settings.defaultDiscount}
                  onChange={(e) => setSettings({ ...settings, defaultDiscount: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              E-Billing System v1.0.0
              <br />
              Stock Management & Billing Solution
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



