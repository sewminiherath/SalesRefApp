"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, RefreshCcw, Pencil } from "lucide-react"
import { clientsApi, type Client } from "@/lib/api/clients"
import { toast } from "sonner"

export function CustomerList() {
  const [customers, setCustomers] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Client | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    client_id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const load = async (term?: string) => {
    try {
      setIsLoading(true)
      const data = await clientsApi.getAll(term)
      setCustomers(data)
    } catch (error: any) {
      toast.error("Failed to load customers: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = customers.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(s) ||
      c.client_id.toLowerCase().includes(s) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.phone && c.phone.toLowerCase().includes(s))
    )
  })

  const openEdit = (c: Client) => {
    setEditing(c)
    setEditForm({
      client_id: c.client_id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    if (!editForm.client_id.trim() || !editForm.name.trim()) {
      toast.error("Client ID and Name are required")
      return
    }

    try {
      setIsSaving(true)
      const updated = await clientsApi.update(editing.id, {
        client_id: editForm.client_id.trim(),
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
      })
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      toast.success("Customer updated")
      setEditing(null)
    } catch (error: any) {
      toast.error("Failed to update customer: " + (error.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Existing customers in the system</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => load(search)}
          disabled={isLoading}
          className="h-9 w-9"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers found</p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {c.name}{" "}
                    <span className="text-xs text-muted-foreground">({c.client_id})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.email || "No email"} • {c.phone || "No phone"}
                  </p>
                </div>
                {c.address && (
                  <p className="text-xs text-muted-foreground md:text-right">{c.address}</p>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(c)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Customer ID *</Label>
              <Input
                value={editForm.client_id}
                onChange={(e) => setEditForm((f) => ({ ...f, client_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}


