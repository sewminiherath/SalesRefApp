"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref = "/dashboard", label = "Back", className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    // Try browser history first
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      {label}
    </Button>
  )
}


