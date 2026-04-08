import { apiRequest } from "./config"

export interface Client {
  id: string
  client_id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export const clientsApi = {
  getAll: async (search?: string): Promise<Client[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : ""
    const data = await apiRequest<any[]>(`/clients${query}`)
    return data.map((c: any) => ({
      id: c.id,
      client_id: c.client_id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    }))
  },

  create: async (client: Omit<Client, "id">): Promise<Client> => {
    const data = await apiRequest<any>("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    })
    return {
      id: data.id,
      client_id: data.client_id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
    }
  },

  update: async (id: string, client: Omit<Client, "id">): Promise<Client> => {
    const data = await apiRequest<any>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    })
    return {
      id: data.id,
      client_id: data.client_id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
    }
  },
}

