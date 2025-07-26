"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"

interface TokenInfo {
  tokenName: string
  tokenSymbol: string
  network: string
  currentPrice: number
  logoUrl?: string
}

interface Position {
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

interface AddPositionModalProps {
  open: boolean
  onClose: () => void
  onAdd: (position: Omit<Position, "id">) => void
}

export function AddPositionModal({ open, onClose, onAdd }: AddPositionModalProps) {
  const [contractAddress, setContractAddress] = useState("")
  const [quantity, setQuantity] = useState("")
  const [amount, setAmount] = useState("")
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingToken, setFetchingToken] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  const fetchTokenData = async (address: string) => {
    if (!address.trim()) return

    setFetchingToken(true)
    setError("")
    setTokenInfo(null)

    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`)
      const data = await response.json()

      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]
        const info: TokenInfo = {
          tokenName: pair.baseToken.name,
          tokenSymbol: pair.baseToken.symbol,
          network: pair.chainId,
          currentPrice: Number.parseFloat(pair.priceUsd || "0"),
          logoUrl: pair.info?.imageUrl,
        }
        setTokenInfo(info)
      } else {
        setError(t.tokenNotFound)
      }
    } catch (error) {
      console.error("Error fetching token data:", error)
      setError(t.invalidAddress)
    } finally {
      setFetchingToken(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setContractAddress(address)

    // Auto-fetch when address looks valid (basic validation)
    if (address.length > 20 && address.startsWith("0x")) {
      const timeoutId = setTimeout(() => {
        fetchTokenData(address)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setTokenInfo(null)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractAddress || !quantity || !amount || !tokenInfo) return

    setLoading(true)

    try {
      const quantityNum = Number.parseFloat(quantity)
      const amountNum = Number.parseFloat(amount)
      const averagePrice = amountNum / quantityNum
      const currentValue = tokenInfo.currentPrice * quantityNum
      const profitLoss = currentValue - amountNum
      const profitLossPercent = ((tokenInfo.currentPrice - averagePrice) / averagePrice) * 100

      const position: Omit<Position, "id"> = {
        contractAddress,
        tokenName: tokenInfo.tokenName,
        tokenSymbol: tokenInfo.tokenSymbol,
        network: tokenInfo.network,
        quantity: quantityNum,
        investedAmount: amountNum,
        averagePrice,
        currentPrice: tokenInfo.currentPrice,
        profitLoss,
        profitLossPercent,
        logoUrl: tokenInfo.logoUrl,
      }

      await onAdd(position)
      handleClose()
    } catch (error) {
      console.error("Error adding position:", error)
      setError(t.errorAddingPosition)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setContractAddress("")
    setQuantity("")
    setAmount("")
    setTokenInfo(null)
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-md max-h-[90vh] p-0">
        <div className="modal-scrollable hidden-scrollbar p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold">{t.addPosition}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="contract" className="text-sm font-medium">
                {t.contractAddress}
              </Label>
              <div className="relative">
                <Input
                  id="contract"
                  value={contractAddress}
                  onChange={handleAddressChange}
                  placeholder="0x..."
                  required
                  className="mt-1 bg-background/50 backdrop-blur-sm border-border/50"
                />
                {fetchingToken && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Token Info Display */}
            {tokenInfo && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">{t.tokenInfo}</span>
                </div>
                <div className="flex items-center gap-3">
                  {tokenInfo.logoUrl ? (
                    <img
                      src={tokenInfo.logoUrl || "/placeholder.svg"}
                      alt={tokenInfo.tokenSymbol}
                      className="w-10 h-10 rounded-full border border-border/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-medium border border-border/30">
                      {tokenInfo.tokenSymbol.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{tokenInfo.tokenSymbol}</div>
                    <div className="text-xs text-muted-foreground">{tokenInfo.tokenName}</div>
                    <div className="text-xs text-muted-foreground">
                      {tokenInfo.network} • ${tokenInfo.currentPrice.toFixed(6)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {contractAddress}
                      </span>
                      <CopyButton text={contractAddress} />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  placeholder="1000"
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
                  placeholder="100.00"
                  required
                  className="mt-1 bg-background/50 backdrop-blur-sm border-border/50"
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {tokenInfo && quantity && amount && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Price:</span>
                  <span className="font-mono">
                    ${(Number.parseFloat(amount) / Number.parseFloat(quantity)).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Value:</span>
                  <span className="font-mono">
                    ${(tokenInfo.currentPrice * Number.parseFloat(quantity)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L:</span>
                  <span
                    className={`font-mono ${
                      tokenInfo.currentPrice * Number.parseFloat(quantity) - Number.parseFloat(amount) >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    $
                    {(
                      tokenInfo.currentPrice * Number.parseFloat(quantity) -
                      Number.parseFloat(amount)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !tokenInfo} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t.fetchingPrice : t.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-border/50 bg-transparent"
                disabled={loading}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
