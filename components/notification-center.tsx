"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { Bell, Search, Edit, Trash2, Volume2 } from "lucide-react"
import { EditAlertModal } from "@/components/edit-alert-modal"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { CopyButton } from "@/components/copy-button"
import { useSoundManager } from "@/hooks/use-sound-manager"
import { useBrowserNotifications } from "@/hooks/use-browser-notifications"

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
  soundFile?: string
  volume?: number
  browserNotification?: boolean
}

interface Portfolio {
  id: string
  name: string
  positions: any[]
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
  alerts: Alert[]
  portfolios: Portfolio[]
  onUpdateAlert: (alertId: string, updates: Partial<Alert>) => void
  onDeleteAlert: (alertId: string) => void
}

export function NotificationCenter({
  open,
  onClose,
  alerts,
  portfolios,
  onUpdateAlert,
  onDeleteAlert,
}: NotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null)
  const { t } = useLanguage()
  const { playSound } = useSoundManager()
  const { showPriceAlert } = useBrowserNotifications()

  // Get position details for each alert
  const enrichedAlerts = alerts.map((alert) => {
    let position = null
    let network = "Unknown"

    for (const portfolio of portfolios) {
      const foundPosition = portfolio.positions.find((p) => p.id === alert.positionId)
      if (foundPosition) {
        position = foundPosition
        network = foundPosition.network
        break
      }
    }

    return {
      ...alert,
      position,
      network,
      currentPrice: position?.currentPrice || 0,
    }
  })

  // Filter alerts based on search query
  const filteredAlerts = enrichedAlerts.filter(
    (alert) =>
      alert.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.contractAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.network.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert)
  }

  const handleDeleteAlert = (alert: Alert) => {
    setDeletingAlert(alert)
  }

  const confirmDelete = async () => {
    if (deletingAlert) {
      await onDeleteAlert(deletingAlert.id)
      setDeletingAlert(null)
    }
  }

  const handleUpdateAlert = async (alertId: string, updates: Partial<Alert>) => {
    await onUpdateAlert(alertId, updates)
    setEditingAlert(null)
  }

  const testAlert = (alert: Alert) => {
    if (alert.soundEnabled) {
      playSound(alert.soundFile || "default", alert.volume || 0.5)
    }
    if (alert.browserNotification) {
      showPriceAlert(alert.tokenSymbol, alert.targetPrice, alert.currentPrice || 0)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-6xl max-h-[90vh] p-0">
          <div className="modal-scrollable hidden-scrollbar p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                <Bell className="h-5 w-5" />
                {t.notificationCenter}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search alerts by token, network, or contract address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
                />
              </div>

              {/* Alerts Table */}
              <div className="border rounded-lg bg-background/30 backdrop-blur-sm overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto hidden-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
                      <TableRow className="border-b border-border/50">
                        <TableHead className="font-semibold">Token</TableHead>
                        <TableHead className="font-semibold">Chain</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Target Price</TableHead>
                        <TableHead className="font-semibold">Current Price</TableHead>
                        <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchQuery ? "No alerts match your search" : t.noActiveAlerts}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAlerts.map((alert, index) => (
                          <TableRow
                            key={alert.id}
                            className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {alert.position?.logoUrl ? (
                                  <img
                                    src={alert.position.logoUrl || "/placeholder.svg"}
                                    alt={alert.tokenSymbol}
                                    className="w-8 h-8 rounded-full border border-border/30"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                      target.nextElementSibling?.classList.remove("hidden")
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium border border-border/30 ${
                                    alert.position?.logoUrl ? "hidden" : ""
                                  }`}
                                >
                                  {alert.tokenSymbol.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium">{alert.tokenSymbol}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {alert.tokenName}
                                  </div>
                                  <CopyButton text={alert.contractAddress} showFullAddress />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {alert.network}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={alert.triggered ? "secondary" : "default"}>
                                {alert.triggered ? t.triggered : t.active}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">${alert.targetPrice.toFixed(6)}</TableCell>
                            <TableCell className="font-mono">
                              <div className="flex items-center gap-2">
                                ${alert.currentPrice.toFixed(6)}
                                {alert.currentPrice > 0 && (
                                  <div
                                    className={`text-xs ${
                                      alert.currentPrice >= alert.targetPrice ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {alert.currentPrice >= alert.targetPrice ? "Above" : "Below"}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => testAlert(alert)}
                                  className="h-8 w-8 p-0 hover:bg-muted/50"
                                  title="Test Alert"
                                >
                                  <Volume2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAlert(alert)}
                                  className="h-8 w-8 p-0 hover:bg-muted/50"
                                  title={t.editAlert}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAlert(alert)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                  title={t.deleteAlert}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{alerts.length}</div>
                  <div className="text-sm text-muted-foreground">Total Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{alerts.filter((a) => !a.triggered).length}</div>
                  <div className="text-sm text-muted-foreground">{t.activeAlerts}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{alerts.filter((a) => a.triggered).length}</div>
                  <div className="text-sm text-muted-foreground">{t.triggeredAlerts}</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Alert Modal */}
      <EditAlertModal
        open={!!editingAlert}
        onClose={() => setEditingAlert(null)}
        alert={editingAlert}
        onUpdate={handleUpdateAlert}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={!!deletingAlert}
        onClose={() => setDeletingAlert(null)}
        onConfirm={confirmDelete}
        title="Delete Alert"
        description={
          deletingAlert
            ? `Are you sure you want to delete the alert for ${deletingAlert.tokenSymbol} at $${deletingAlert.targetPrice}?`
            : ""
        }
      />
    </>
  )
}
