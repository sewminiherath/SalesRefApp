"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi, type User } from "@/lib/api/auth"
import { getAuthToken, removeAuthToken } from "@/lib/api/config"

export type LoginResult = { ok: true } | { ok: false; message: string }

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      authApi
        .getCurrentUser()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          removeAuthToken()
          setUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await authApi.login({ username, password })
      setUser(response.user)
      return { ok: true }
    } catch (error) {
      console.error("Login error:", error)
      const message =
        error instanceof Error ? error.message : "Sign-in failed. Please try again."
      return { ok: false, message }
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

