"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/language-provider"
import { Edit, Volume2, Loader2 } from "lucide-react"
import { CopyButton } from "@/components/copy-button"

interface Alert {
  id: string
  positionId: string
  tokenSymbol: string
  tokenName: string
  contractAddress: string
  targetPrice: number
  isOneTime: boolean
  soundEnabled: boolean
  triggered: boolean
  createdAt: Date
  lastTriggered?: Date
}

interface EditAlertModalProps {
  open: boolean
  onClose: () => void
  alert: Alert | null
  onUpdate: (alertId: string, updates: Partial<Alert>) => void
}

export function EditAlertModal({ open, onClose, alert, onUpdate }: EditAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState("")
  const [isOneTime, setIsOneTime] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (alert) {
      setTargetPrice(alert.targetPrice.toString())
      setIsOneTime(alert.isOneTime)
      setSoundEnabled(alert.soundEnabled)
    }
  }, [alert])

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error("Error playing alert sound:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetPrice || !alert) return

    setLoading(true)

    try {
      const updates = {
        targetPrice: Number.parseFloat(targetPrice),
        isOneTime,
        soundEnabled,
        triggered: false, // Reset triggered status when editing
      }

      await onUpdate(alert.id, updates)
      onClose()
    } catch (error) {
      console.error("Error updating alert:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!alert) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-lg max-h-[90vh] p-0">
        <div className="modal-scrollable hidden-scrollbar p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Edit className="h-5 w-5" />
              {t.editAlert}
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium border border-border/30">
                {alert.tokenSymbol.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{alert.tokenSymbol}</div>
                <div className="text-sm text-muted-foreground">{alert.tokenName}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    {alert.contractAddress}
                  </span>
                  <CopyButton text={alert.contractAddress} />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                {t.targetPrice}
              </Label>
              <Input
                id="price"
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                required
                className="mt-1 bg-background/50 backdrop-blur-sm border-border/50"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {t.whenPriceCrosses} ${targetPrice || "0.00"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
                <div>
                  <Label htmlFor="oneTime" className="text-sm font-medium">
                    {t.oneTime}
                  </Label>
                  <div className="text-xs text-muted-foreground">Alert only once when price crosses</div>
                </div>
                <Switch id="oneTime" checked={isOneTime} onCheckedChange={setIsOneTime} />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
                <div>
                  <Label htmlFor="sound" className="flex items-center gap-2 text-sm font-medium">
                    <Volume2 className="h-4 w-4" />
                    {t.soundAlert}
                  </Label>
                  <div className="text-xs text-muted-foreground">Play sound when alert triggers</div>
                </div>
                <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={playAlertSound}
              className="w-full border-border/50 bg-transparent"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {t.testSound}
            </Button>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Updating..." : "Update Alert"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-border/50 bg-transparent"
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
