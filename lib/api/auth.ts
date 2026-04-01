import { apiRequest, setAuthToken, removeAuthToken } from "./config"

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
  name: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const username = credentials.username.trim()
    const password = credentials.password.trim()
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    
    setAuthToken(response.token)
    return response
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>("/auth/me")
  },

  logout: () => {
    removeAuthToken()
  },
}

