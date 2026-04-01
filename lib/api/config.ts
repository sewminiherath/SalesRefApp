// API Configuration - Connect to main backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ebilling_token")
  }
  return null
}

// Helper function to set auth token
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("ebilling_token", token)
  }
}

// Helper function to remove auth token
export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ebilling_token")
  }
}

// API request helper
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const error = JSON.parse(text)
      if (error?.error) errorMessage = error.error
    } catch {
      if (text && text.length < 200) errorMessage = text
    }
    console.error("API Error:", {
      endpoint: `${API_BASE_URL}${endpoint}`,
      status: response.status,
      error: errorMessage,
    })
    throw new Error(errorMessage)
  }

  return response.json()
}

