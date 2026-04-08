import { apiRequest } from "./config"

export interface StockItem {
  id: string
  item_code: string
  item_name: string
  category: string
  unit_price: number
  quantity: number
  reorder_level: number
  description?: string
  image?: string | null
}

export const itemsApi = {
  getAll: async (search?: string): Promise<StockItem[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : ""
    const data = await apiRequest<any[]>(`/items${query}`)
    return data.map((item: any) => ({
      id: item.id,
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      description: item.description || "",
      image: item.image || undefined,
    }))
  },

  create: async (item: Omit<StockItem, "id">): Promise<StockItem> => {
    const data = await apiRequest<any>("/items", {
      method: "POST",
      body: JSON.stringify(item),
    })
    return {
      id: data.id,
      item_code: data.item_code,
      item_name: data.item_name,
      category: data.category,
      unit_price: data.unit_price,
      quantity: data.quantity,
      reorder_level: data.reorder_level,
      description: data.description || "",
      image: data.image || undefined,
    }
  },

  update: async (id: string, item: Omit<StockItem, "id">): Promise<StockItem> => {
    const data = await apiRequest<any>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    })
    return {
      id: data.id,
      item_code: data.item_code,
      item_name: data.item_name,
      category: data.category,
      unit_price: data.unit_price,
      quantity: data.quantity,
      reorder_level: data.reorder_level,
      description: data.description || "",
      image: data.image || undefined,
    }
  },
}

