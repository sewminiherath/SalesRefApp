import { apiRequest } from "./config"

export interface InvoiceItem {
  item_id: string
  quantity: number
}

export interface CreateInvoiceData {
  client_id: string
  items: InvoiceItem[]
  discount?: number
  tax?: number
  status?: "paid" | "pending" | "overdue"
  date?: string
  payment_method?: "cash" | "cheque" | "card" | "transfer"
  cash_amount?: number
  cash_change?: number
  cheque_number?: string
  cheque_bank?: string
  cheque_date?: string
  cheque_amount?: number
}

export interface Invoice {
  id: string
  invoice_number: string
  date: string
  client_id: string
  client_name?: string
  items: any[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: "paid" | "pending" | "overdue"
  payment_method?: "cash" | "cheque" | "card" | "transfer"
  cash_amount?: number
  cash_change?: number
  cheque_number?: string
  cheque_bank?: string
  cheque_date?: string
  cheque_amount?: number
}

export const invoicesApi = {
  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const result = await apiRequest<any>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return result
  },

  getAll: async (): Promise<Invoice[]> => {
    const data = await apiRequest<any[]>("/invoices")
    return data
  },

  getById: async (id: string): Promise<Invoice> => {
    return apiRequest<Invoice>(`/invoices/${id}`)
  },

  sendEmail: async (id: string, email?: string): Promise<{ success: boolean; sent_to: string }> => {
    return apiRequest<{ success: boolean; sent_to: string }>(`/invoices/${id}/send-email`, {
      method: "POST",
      body: JSON.stringify(email ? { email } : {}),
    })
  },
}

