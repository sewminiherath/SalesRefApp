"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { clientsApi, type Client } from "@/lib/api/clients"
import { toast } from "sonner"

interface CreateCustomerFormProps {
  onCreated?: (client: Client) => void
}

export function CreateCustomerForm({ onCreated }: CreateCustomerFormProps) {
  const [form, setForm] = useState({
    client_id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value })
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.client_id || !form.name) {
      toast.error("Client ID and Name are required")
      return
    }

    try {
      setIsSubmitting(true)
      const created = await clientsApi.create({
        id: "",
        client_id: form.client_id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      })
      toast.success("Customer added successfully")
      setForm({ client_id: "", name: "", email: "", phone: "", address: "" })
      onCreated?.(created)
    } catch (error: any) {
      toast.error("Failed to add customer: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Customer</CardTitle>
        <CardDescription>Create a new customer record</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">Customer ID *</Label>
              <Input
                id="client_id"
                value={form.client_id}
                onChange={handleChange("client_id")}
                placeholder="C001"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Customer name"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="customer@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="0123456789"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={handleChange("address")}
              placeholder="Address"
              className="h-10"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? "Saving..." : "Save Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


