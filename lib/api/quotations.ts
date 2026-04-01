import { apiRequest } from "./config"

export interface QuotationItem {
  item_id: string
  quantity: number
}

export interface CreateQuotationData {
  client_id: string
  items: QuotationItem[]
  discount?: number
  tax?: number
  date?: string
}

export interface Quotation {
  id: string
  quotation_number: string
  date: string
  client_id: string
  client_name?: string
  items: any[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: "pending" | "accepted" | "rejected"
}

export const quotationsApi = {
  create: async (data: CreateQuotationData): Promise<Quotation> => {
    return apiRequest<Quotation>("/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getAll: async (): Promise<Quotation[]> => {
    return apiRequest<Quotation[]>("/quotations")
  },

  getById: async (id: string): Promise<Quotation> => {
    return apiRequest<Quotation>(`/quotations/${id}`)
  },

  convertToInvoice: async (id: string): Promise<any> => {
    return apiRequest<any>(`/quotations/${id}/convert`, {
      method: "POST",
    })
  },
}



