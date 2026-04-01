"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { toast } from "sonner"

interface CreateProductFormProps {
  onCreated?: (item: StockItem) => void
}

export function CreateProductForm({ onCreated }: CreateProductFormProps) {
  const [form, setForm] = useState({
    item_code: "",
    item_name: "",
    category: "General",
    unit_price: "",
    quantity: "",
    reorder_level: "",
    description: "",
    image: "" as string,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (e.g. JPG, PNG)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const clearImage = () => setForm((f) => ({ ...f, image: "" }))

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value })
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.item_code || !form.item_name) {
      toast.error("Item Code and Name are required")
      return
    }

    try {
      setIsSubmitting(true)
      const created = await itemsApi.create({
        id: "",
        item_code: form.item_code,
        item_name: form.item_name,
        category: form.category || "General",
        unit_price: Number(form.unit_price) || 0,
        quantity: Number(form.quantity) || 0,
        reorder_level: Number(form.reorder_level) || 0,
        description: form.description,
        image: form.image || undefined,
      })
      toast.success("Product added successfully")
      setForm({
        item_code: "",
        item_name: "",
        category: "General",
        unit_price: "",
        quantity: "",
        reorder_level: "",
        description: "",
        image: "",
      })
      onCreated?.(created)
    } catch (error: any) {
      toast.error("Failed to add product: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Product</CardTitle>
        <CardDescription>Add a new stock item</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item_code">Item Code *</Label>
              <Input
                id="item_code"
                value={form.item_code}
                onChange={handleChange("item_code")}
                placeholder="ITM001"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={form.item_name}
                onChange={handleChange("item_name")}
                placeholder="Product name"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={handleChange("category")}
                placeholder="Category"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                value={form.unit_price}
                onChange={handleChange("unit_price")}
                placeholder="0.00"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={handleChange("quantity")}
                placeholder="0"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={handleChange("reorder_level")}
                placeholder="0"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Optional description"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="h-10 max-w-xs"
              />
              <Input
                type="url"
                value={form.image && form.image.startsWith("http") ? form.image : ""}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="Or paste image URL"
                className="h-10 flex-1"
              />
              {form.image ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
                  Clear
                </Button>
              ) : null}
            </div>
            {form.image ? (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <img
                  src={form.image}
                  alt="Product"
                  className="h-24 w-24 object-cover rounded border"
                />
              </div>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


