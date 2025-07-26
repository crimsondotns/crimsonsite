"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { Bell, Volume2, Upload, AlertCircle, Mail, Settings, TrendingUp, TrendingDown, Target } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { useSoundManager } from "@/hooks/use-sound-manager"
import { useBrowserNotifications } from "@/hooks/use-browser-notifications"
import { useEmailNotifications } from "@/hooks/use-email-notifications"
import { Slider } from "@/components/ui/slider"
import { EmailSettingsModal } from "@/components/email-settings-modal"

interface Position {
  id: string
  tokenName: string
  tokenSymbol: string
  currentPrice: number
  logoUrl?: string
  contractAddress: string
  averagePrice: number
}

interface AlertModalProps {
  open: boolean
  onClose: () => void
  position: Position | null
  onAddAlert: (alertData: any) => void
}

type AlertType = "price" | "percentage"
type PercentageType = "take_profit" | "stop_loss"

export function AlertModal({ open, onClose, position, onAddAlert }: AlertModalProps) {
  const [alertType, setAlertType] = useState<AlertType>("price")
  const [targetPrice, setTargetPrice] = useState("")
  const [percentageValue, setPercentageValue] = useState("")
  const [percentageType, setPercentageType] = useState<PercentageType>("take_profit")
  const [isOneTime, setIsOneTime] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundFile, setSoundFile] = useState("default")
  const [volume, setVolume] = useState(0.5)
  const [browserNotification, setBrowserNotification] = useState(false)
  const [emailNotification, setEmailNotification] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const { t } = useLanguage()

  const { soundFiles, uploadSoundFile, playSound, saveVolume } = useSoundManager()
  const { permission, requestPermission, isSupported } = useBrowserNotifications()
  const { emailSettings } = useEmailNotifications()

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setUploadError("")
        const newSound = await uploadSoundFile(file)
        setSoundFile(newSound.id)
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Failed to upload sound")
      }
    }
    e.target.value = ""
  }

  const handleTestSound = async () => {
    try {
      await playSound(soundFile, volume)
    } catch (error) {
      console.error("Error testing sound:", error)
    }
  }

  const calculateTargetPrice = () => {
    if (!position || alertType !== "percentage" || !percentageValue) return 0

    const percentage = Number.parseFloat(percentageValue)
    const basePrice = position.averagePrice || position.currentPrice

    if (percentageType === "take_profit") {
      return basePrice * (1 + Math.abs(percentage) / 100)
    } else {
      return basePrice * (1 - Math.abs(percentage) / 100)
    }
  }

  const handlePercentageChange = (value: string) => {
    setPercentageValue(value)
    const numValue = Number.parseFloat(value)

    // Auto-detect stop loss vs take profit based on sign
    if (numValue < 0) {
      setPercentageType("stop_loss")
    } else if (numValue > 0) {
      setPercentageType("take_profit")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!position) return

    let finalTargetPrice = 0
    let alertTypeLabel = "price"

    if (alertType === "price") {
      if (!targetPrice) return
      finalTargetPrice = Number.parseFloat(targetPrice)
      alertTypeLabel = "price"
    } else {
      if (!percentageValue) return
      finalTargetPrice = calculateTargetPrice()
      alertTypeLabel = percentageType === "take_profit" ? "take profit" : "stop loss"
    }

    const alertData = {
      positionId: position.id,
      tokenSymbol: position.tokenSymbol,
      tokenName: position.tokenName,
      contractAddress: position.contractAddress,
      targetPrice: finalTargetPrice,
      alertType: alertTypeLabel,
      percentageValue: alertType === "percentage" ? Number.parseFloat(percentageValue) : null,
      isOneTime,
      soundEnabled,
      soundFile,
      volume,
      browserNotification,
      emailNotification:
        emailNotification && emailSettings.enabled && (emailSettings.emailAddresses?.some((e) => e.verified) || false),
    }

    await onAddAlert(alertData)

    // Demo: play sound immediately
    if (soundEnabled) {
      handleTestSound()
    }

    handleClose()
  }

  const handleClose = () => {
    setAlertType("price")
    setTargetPrice("")
    setPercentageValue("")
    setPercentageType("take_profit")
    setUploadError("")
    onClose()
  }

  if (!position) return null

  const calculatedPrice = alertType === "percentage" ? calculateTargetPrice() : 0
  const verifiedEmailCount = emailSettings.emailAddresses?.filter((e) => e.verified).length || 0

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-lg max-h-[90vh] p-0">
          <div className="modal-scrollable hidden-scrollbar p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Bell className="h-5 w-5" />
                {t.priceAlert}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/30">
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
                  <div className="text-sm text-muted-foreground">
                    Current: ${position.currentPrice.toFixed(6)} | Avg: ${(position.averagePrice || 0).toFixed(6)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {position.contractAddress}
                    </span>
                    <CopyButton text={position.contractAddress} />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert Type Selection */}
              <div>
                <Label className="text-sm font-medium">Alert Type</Label>
                <Select value={alertType} onValueChange={(value: AlertType) => setAlertType(value)}>
                  <SelectTrigger className="mt-1 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Target Price
                      </div>
                    </SelectItem>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Percentage (Take Profit / Stop Loss)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Input */}
              {alertType === "price" && (
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
                    Alert when price crosses ${targetPrice || "0.00"}
                  </div>
                </div>
              )}

              {/* Percentage Input */}
              {alertType === "percentage" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="percentage" className="text-sm font-medium">
                      Percentage Change
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="percentage"
                        type="number"
                        step="any"
                        value={percentageValue}
                        onChange={(e) => handlePercentageChange(e.target.value)}
                        placeholder="10 or -10"
                        required
                        className="bg-background/50 backdrop-blur-sm border-border/50"
                      />
                      <Select
                        value={percentageType}
                        onValueChange={(value: PercentageType) => setPercentageType(value)}
                      >
                        <SelectTrigger className="w-40 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="take_profit">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Take Profit
                            </div>
                          </SelectItem>
                          <SelectItem value="stop_loss">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              Stop Loss
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {percentageValue && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-2">
                          {percentageType === "take_profit" ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>
                            {percentageType === "take_profit" ? "Take Profit" : "Stop Loss"}:{" "}
                            {Math.abs(Number.parseFloat(percentageValue) || 0)}%
                          </span>
                        </div>
                        <div className="mt-1">
                          Target Price: ${calculatedPrice.toFixed(6)} (from avg price $
                          {(position.averagePrice || position.currentPrice).toFixed(6)})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
                  <div>
                    <Label htmlFor="oneTime" className="text-sm font-medium">
                      {t.oneTime}
                    </Label>
                    <div className="text-xs text-muted-foreground">Alert only once when target is reached</div>
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

              {soundEnabled && (
                <div className="space-y-4 p-4 bg-muted/10 rounded-lg border border-border/20">
                  <h4 className="font-medium text-sm">Sound Settings</h4>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Alert Sound</Label>
                      <Select value={soundFile} onValueChange={setSoundFile}>
                        <SelectTrigger className="mt-1 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {soundFiles.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Volume</Label>
                      <div className="mt-2 px-3">
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => setVolume(value[0])}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0%</span>
                          <span>{Math.round(volume * 100)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {uploadError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestSound}
                        className="flex-1 border-border/50 bg-transparent"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Sound
                      </Button>

                      <div className="relative">
                        <input
                          type="file"
                          accept="audio/mp3,audio/wav,audio/ogg,audio/m4a"
                          onChange={handleSoundUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Upload custom sound (MP3, WAV, OGG, M4A - max 2MB)"
                        />
                        <Button type="button" variant="outline" className="border-border/50 bg-transparent">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Notification Settings</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailSettings(true)}
                    className="border-border/50 bg-transparent"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Email Settings
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="browserNotif" className="text-sm font-medium">
                      Browser Notifications
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {!isSupported
                        ? "Not supported in this browser"
                        : permission === "granted"
                          ? "Notifications enabled"
                          : permission === "denied"
                            ? "Notifications blocked"
                            : "Click to enable notifications"}
                    </div>
                  </div>
                  <Switch
                    id="browserNotif"
                    checked={browserNotification && permission === "granted"}
                    onCheckedChange={async (checked) => {
                      if (checked && permission !== "granted") {
                        const granted = await requestPermission()
                        setBrowserNotification(granted)
                      } else {
                        setBrowserNotification(checked)
                      }
                    }}
                    disabled={!isSupported}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotif" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {verifiedEmailCount === 0
                        ? "No verified emails configured"
                        : !emailSettings.enabled
                          ? "Email notifications disabled"
                          : `Send to ${verifiedEmailCount} verified email${verifiedEmailCount > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={emailNotification && emailSettings.enabled && verifiedEmailCount > 0}
                    onCheckedChange={setEmailNotification}
                    disabled={!emailSettings.enabled || verifiedEmailCount === 0}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  <Bell className="h-4 w-4 mr-2" />
                  Create Alert
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

      <EmailSettingsModal open={showEmailSettings} onClose={() => setShowEmailSettings(false)} />
    </>
  )
}
