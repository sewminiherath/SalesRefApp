// API Configuration - Connect to main backend (no trailing slash)
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api")
  .trim()
  .replace(/\/+$/, "")

/** For UI: safe display of where API calls go */
export function getApiDisplayUrl(): string {
  try {
    const u = new URL(API_BASE_URL)
    return `${u.origin}${u.pathname}`
  } catch {
    return API_BASE_URL
  }
}

/** True when NEXT_PUBLIC_API_URL points at this machine (wrong for Vercel / phones). */
export function apiPointsToLocalhost(): boolean {
  try {
    const u = new URL(API_BASE_URL)
    return u.hostname === "localhost" || u.hostname === "127.0.0.1"
  } catch {
    return /localhost|127\.0\.0\.1/.test(API_BASE_URL)
  }
}

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

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach the API server. On another device, use your PC's IP or a public API URL — not localhost. Set NEXT_PUBLIC_API_URL and ensure the backend is running."
      )
    }
    throw e
  }

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

