"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"
import { Loader2, AlertCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"

interface Position {
  id: string
  contractAddress: string
  tokenName: string
  tokenSymbol: string
  network: string
  quantity: number
  investedAmount: number
  averagePrice: number
  currentPrice: number
  profitLoss: number
  profitLossPercent: number
  logoUrl?: string
}

interface EditPositionModalProps {
  open: boolean
  onClose: () => void
  position: Position | null
  onEdit: (position: Position) => void
}

export function EditPositionModal({ open, onClose, position, onEdit }: EditPositionModalProps) {
  const [quantity, setQuantity] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  useEffect(() => {
    if (position) {
      setQuantity(position.quantity.toString())
      setAmount(position.investedAmount.toString())
      setError("")
    }
  }, [position])

  const fetchCurrentPrice = async (address: string) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`)
      const data = await response.json()

      if (data.pairs && data.pairs.length > 0) {
        return Number.parseFloat(data.pairs[0].priceUsd || "0")
      }
      return position?.currentPrice || 0
    } catch (error) {
      console.error("Error fetching current price:", error)
      return position?.currentPrice || 0
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!position || !quantity || !amount) return

    setLoading(true)
    setError("")

    try {
      const currentPrice = await fetchCurrentPrice(position.contractAddress)
      const quantityNum = Number.parseFloat(quantity)
      const amountNum = Number.parseFloat(amount)
      const averagePrice = amountNum / quantityNum
      const currentValue = currentPrice * quantityNum
      const profitLoss = currentValue - amountNum
      const profitLossPercent = ((currentPrice - averagePrice) / averagePrice) * 100

      const updatedPosition: Position = {
        ...position,
        quantity: quantityNum,
        investedAmount: amountNum,
        averagePrice,
        currentPrice,
        profitLoss,
        profitLossPercent,
      }

      await onEdit(updatedPosition)
      onClose()
    } catch (error) {
      console.error("Error updating position:", error)
      setError(t.errorUpdatingPosition)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onClose()
  }

  if (!position) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t.editPosition}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Token</Label>
            <div className="flex items-center gap-3 p-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/30 mt-1">
              {position.logoUrl ? (
                <img
                  src={position.logoUrl || "/placeholder.svg"}
                  alt={position.tokenSymbol}
                  className="w-8 h-8 rounded-full border border-border/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium border border-border/30">
                  {position.tokenSymbol.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium">{position.tokenSymbol}</div>
                <div className="text-sm text-muted-foreground">{position.tokenName}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    {position.contractAddress}
                  </span>
                  <CopyButton text={position.contractAddress} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                {t.quantity}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="mt-1 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>

            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                {t.amount}
              </Label>
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t.fetchingPrice : t.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border/50"
              disabled={loading}
            >
              {t.cancel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
