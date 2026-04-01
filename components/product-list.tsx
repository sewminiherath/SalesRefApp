"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCcw } from "lucide-react"
import { itemsApi, type StockItem } from "@/lib/api/items"
import { toast } from "sonner"

export function ProductList() {
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

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
                    <div className="h-12 w-12 rounded border bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


