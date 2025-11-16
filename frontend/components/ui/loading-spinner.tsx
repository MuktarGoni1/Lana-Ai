"use client"

import React from "react"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"

const sizeMap: Record<Size, string> = {
  sm: "h-6 w-6 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
}

export function LoadingSpinner({
  size = "md",
  label,
  className,
}: {
  size?: Size
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        aria-label="Loading"
        role="status"
        className={cn(
          "rounded-full animate-spin",
          "border-gray-700 border-t-gray-300",
          sizeMap[size]
        )}
      />
      {label && (
        <span className="text-sm text-white/50">{label}</span>
      )}
    </div>
  )
}

export default LoadingSpinner