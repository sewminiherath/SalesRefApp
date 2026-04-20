"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, RefreshCcw, Pencil, Loader2 } from "lucide-react"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { toast } from "sonner"

export function ProductList() {
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    item_code: "",
    item_name: "",
    category: "General",
    unit_price: "",
    quantity: "",
    reorder_level: "",
    description: "",
    image: "",
  })

  const load = async (term?: string) => {
    try {
      setIsLoading(true)
      const data = await itemsApi.getAll(term)
      setItems(data)
    } catch (error: any) {
      toast.error("Failed to load products: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = items.filter((i) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      i.item_name.toLowerCase().includes(s) ||
      i.item_code.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s)
    )
  })

  const openEdit = (item: StockItem) => {
    setEditing(item)
    setOpenAt(Date.now())
    setEditForm({
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category || "General",
      unit_price: String(item.unit_price ?? 0),
      quantity: String(item.quantity ?? 0),
      reorder_level: String(item.reorder_level ?? 0),
      description: item.description || "",
      image: item.image || "",
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    if (!editForm.item_code.trim() || !editForm.item_name.trim()) {
      toast.error("Item Code and Name are required")
      return
    }
    try {
      setIsSaving(true)
      const nextImage = editForm.image.trim()
      const payload: Omit<StockItem, "id"> = {
        item_code: editForm.item_code.trim(),
        item_name: editForm.item_name.trim(),
        category: editForm.category.trim() || "General",
        unit_price: Number(editForm.unit_price) || 0,
        quantity: Number(editForm.quantity) || 0,
        reorder_level: Number(editForm.reorder_level) || 0,
        description: editForm.description.trim(),
        image: nextImage || undefined,
      }

      // Avoid re-sending the same large base64 image on every save.
      if ((editing.image || "") === nextImage) {
        delete payload.image
      }

      const updated = await itemsApi.update(editing.id, payload)
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      toast.success("Product updated")
      setEditing(null)
      if (openAt) {
        const seconds = ((Date.now() - openAt) / 1000).toFixed(1)
        toast.message(`Saved in ${seconds}s`)
      }
    } catch (error: any) {
      toast.error("Failed to update product: " + (error.message || "Unknown error"))
    } finally {
      setIsSaving(false)
      setOpenAt(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>Stock items available for invoicing</CardDescription>
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
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found</p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.item_name}
                      className="h-12 w-12 rounded object-cover border shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded border border-zinc-200 bg-white shrink-0 flex items-center justify-center text-zinc-500 text-xs">
                      No img
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {item.item_name}{" "}
                      <span className="text-xs text-muted-foreground">({item.item_code})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Category: {item.category} • Price: Rs. {item.unit_price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      item.quantity <= item.reorder_level
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }
                  >
                    Stock: {item.quantity}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Reorder at {item.reorder_level}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setOpenAt(null)
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 max-h-[90vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto px-6 pb-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Item Code *</Label>
                <Input
                  value={editForm.item_code}
                  onChange={(e) => setEditForm((f) => ({ ...f, item_code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  value={editForm.item_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, item_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.unit_price}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit_price: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.reorder_level}
                  onChange={(e) => setEditForm((f) => ({ ...f, reorder_level: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Image (URL or base64)</Label>
              <Input
                value={editForm.image}
                onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
              />
            </div>
            {editForm.image ? (
              <div className="space-y-1">
                <Label>Preview</Label>
                <img
                  src={editForm.image}
                  alt="Product preview"
                  className="h-20 w-20 rounded border object-cover"
                />
              </div>
            ) : null}
          </div>
          <div className="sticky bottom-0 border-t bg-white px-6 py-3">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}


