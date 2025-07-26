"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  showFullAddress?: boolean
}

export function CopyButton({ text, className, showFullAddress = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-1">
      {showFullAddress && <span className="text-xs text-muted-foreground font-mono">{shortenAddress(text)}</span>}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className={cn("h-4 w-4 p-0 hover:bg-muted/50 transition-colors relative", className)}
        title={copied ? "Copied!" : "Copy contract address"}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        )}

        {/* Tooltip */}
        {copied && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in z-50">
            Copied!
          </div>
        )}
      </Button>
    </div>
  )
}
