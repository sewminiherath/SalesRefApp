"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL, apiPointsToLocalhost, getApiDisplayUrl } from "@/lib/api/config"

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().trim().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function pageIsOnPublicHost(): boolean {
  if (typeof window === "undefined") return false
  const h = window.location.hostname
  return h !== "localhost" && h !== "127.0.0.1"
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await login(data.username, data.password)
      if (result.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">E-Billing System</CardTitle>
            <CardDescription className="mt-2">Sales Agent Login</CardDescription>
            <p className="text-xs text-muted-foreground break-all mt-3" title={API_BASE_URL}>
              API: {getApiDisplayUrl()}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mounted && pageIsOnPublicHost() && apiPointsToLocalhost() && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This site is open on the internet, but the app is still set to use{" "}
                  <strong>localhost</strong> for the API. Add{" "}
                  <code className="text-xs">NEXT_PUBLIC_API_URL</code> in your Vercel project →
                  Settings → Environment Variables (your public backend URL ending in{" "}
                  <code className="text-xs">/api</code>), then redeploy. Production app:{" "}
                  <a
                    href="https://ebilling-system.vercel.app/"
                    className="underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ebilling-system.vercel.app
                  </a>
                  .
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <span className="block">{error}</span>
                  {error.includes("Invalid username") && (
                    <span className="block text-sm font-normal opacity-95">
                      On a new server the default user is <strong>admin</strong> /{" "}
                      <strong>admin123</strong>. Users you created on another machine stay in that
                      machine&apos;s database — deploy a backend with its own{" "}
                      <code className="text-xs">ebilling.sqlite</code> or add users there.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...register("username")}
                disabled={isLoading}
                autoComplete="username"
                className="text-lg h-12"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                disabled={isLoading}
                autoComplete="current-password"
                className="text-lg h-12"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

