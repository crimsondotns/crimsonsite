"use client"

import { useState } from "react"
import { PortfolioSidebar } from "@/components/portfolio-sidebar"
import { PortfolioTable } from "@/components/portfolio-table"
import { AddPositionModal } from "@/components/add-position-modal"
import { EditPositionModal } from "@/components/edit-position-modal"
import { AlertModal } from "@/components/alert-modal"
import { AuthModal } from "@/components/auth-modal"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { AdminPanel } from "@/components/admin-panel"
import { NotificationCenter } from "@/components/notification-center"
import { LanguageProvider } from "@/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, User, Sun, Moon, Globe, RefreshCw, Bell, Download, Shield } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { useAdmin } from "@/hooks/use-admin"
import { usePortfolio } from "@/hooks/use-portfolio"
import { usePriceUpdates } from "@/hooks/use-price-updates"
import { useAlerts } from "@/hooks/use-alerts"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { exportToCSV } from "@/lib/export"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"

function PortfolioApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [showEditPosition, setShowEditPosition] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [editingPosition, setEditingPosition] = useState<any>(null)
  const [alertPosition, setAlertPosition] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [showDeletePosition, setShowDeletePosition] = useState(false)
  const [showDeletePortfolio, setShowDeletePortfolio] = useState(false)
  const [deletingPosition, setDeletingPosition] = useState<any>(null)
  const [deletingPortfolio, setDeletingPortfolio] = useState<any>(null)

  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const { isAuthenticated: isAdminAuthenticated } = useAdmin()
  const { toast } = useToast()
  const {
    portfolios,
    activePortfolio,
    setActivePortfolio,
    addPortfolio,
    deletePortfolio,
    updatePortfolio,
    addPosition,
    updatePosition,
    deletePosition,
  } = usePortfolio()

  const { alerts, addAlert, updateAlert, deleteAlert } = useAlerts()

  // Auto-refresh prices every 30 seconds
  usePriceUpdates(portfolios, updatePosition, alerts, (alert) => {
    toast({
      title: "🚨 Price Alert",
      description: `${alert.tokenSymbol} crossed $${alert.targetPrice}`,
    })
  })

  const currentPortfolio = portfolios.find((p) => p.id === activePortfolio)
  const filteredPositions =
    currentPortfolio?.positions.filter(
      (position) =>
        position.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.contractAddress.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const handleAddPosition = async (positionData: any) => {
    try {
      await addPosition(activePortfolio, positionData)
      toast({
        title: "✅ Position Added",
        description: `${positionData.tokenSymbol} added to portfolio`,
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to add position",
        variant: "destructive",
      })
    }
  }

  const handleEditPosition = async (position: any) => {
    try {
      await updatePosition(activePortfolio, position)
      toast({
        title: "✅ Position Updated",
        description: `${position.tokenSymbol} updated successfully`,
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to update position",
        variant: "destructive",
      })
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    const position = filteredPositions.find((p) => p.id === positionId)
    if (position) {
      setDeletingPosition(position)
      setShowDeletePosition(true)
    }
  }

  const confirmDeletePosition = async () => {
    if (deletingPosition) {
      try {
        await deletePosition(activePortfolio, deletingPosition.id)
        toast({
          title: "✅ Position Deleted",
          description: "Position removed from portfolio",
        })
      } catch (error) {
        toast({
          title: "❌ Error",
          description: "Failed to delete position",
          variant: "destructive",
        })
      }
      setDeletingPosition(null)
      setShowDeletePosition(false)
    }
  }

  const handleDeletePortfolio = async (portfolioId: string) => {
    const portfolio = portfolios.find((p) => p.id === portfolioId)
    if (portfolio) {
      setDeletingPortfolio(portfolio)
      setShowDeletePortfolio(true)
    }
  }

  const confirmDeletePortfolio = async () => {
    if (deletingPortfolio) {
      if (portfolios.length <= 1) {
        toast({
          title: "❌ Error",
          description: t.cannotDeleteLast,
          variant: "destructive",
        })
        return
      }

      try {
        await deletePortfolio(deletingPortfolio.id)
        toast({
          title: "✅ Portfolio Deleted",
          description: "Portfolio removed successfully",
        })
      } catch (error) {
        toast({
          title: "❌ Error",
          description: "Failed to delete portfolio",
          variant: "destructive",
        })
      }
      setDeletingPortfolio(null)
      setShowDeletePortfolio(false)
    }
  }

  const openEditModal = (position: any) => {
    setEditingPosition(position)
    setShowEditPosition(true)
  }

  const openAlertModal = (position: any) => {
    setAlertPosition(position)
    setShowAlertModal(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (currentPortfolio) {
        for (const position of currentPortfolio.positions) {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${position.contractAddress}`)
          const data = await response.json()
          if (data.pairs && data.pairs.length > 0) {
            const newPrice = Number.parseFloat(data.pairs[0].priceUsd || "0")
            const currentValue = newPrice * position.quantity
            const profitLoss = currentValue - position.investedAmount
            const profitLossPercent = ((newPrice - position.averagePrice) / position.averagePrice) * 100

            await updatePosition(activePortfolio, {
              ...position,
              currentPrice: newPrice,
              profitLoss,
              profitLossPercent,
            })
          }
        }
      }
      toast({
        title: "✅ Refreshed",
        description: "All prices updated successfully",
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to refresh prices",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportCSV = () => {
    if (currentPortfolio) {
      exportToCSV(currentPortfolio.positions, currentPortfolio.name)
      toast({
        title: "✅ Exported",
        description: "Portfolio exported to CSV",
      })
    }
  }

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setShowAdminPanel(true)
    } else {
      setShowAdminLogin(true)
    }
  }

  const activeAlerts = alerts.filter((alert) => !alert.triggered)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="flex h-screen">
        {/* Sidebar */}
        <PortfolioSidebar
          portfolios={portfolios}
          activePortfolio={activePortfolio}
          onPortfolioChange={setActivePortfolio}
          onAddPortfolio={addPortfolio}
          onDeletePortfolio={handleDeletePortfolio}
          onUpdatePortfolio={updatePortfolio}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {currentPortfolio?.name || t.portfolio}
                </h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-background/50 backdrop-blur-sm border-border/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNotifications(true)}
                  className="bg-background/50 backdrop-blur-sm border-border/50 relative"
                >
                  <Bell className="h-4 w-4" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeAlerts.length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportCSV}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAdminAccess}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  <Shield className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setLanguage(language === "en" ? "th" : "en")}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  <Globe className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-background/50 backdrop-blur-sm border-border/50"
                >
                  <User className="h-4 w-4" />
                </Button>

                <Button
                  onClick={() => setShowAddPosition(true)}
                  className="bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addPosition}
                </Button>
              </div>
            </div>
          </header>

          {/* Portfolio Table */}
          <main className="flex-1 p-6 animate-fade-in">
            <div className="bg-background/50 backdrop-blur-md rounded-xl border border-border/50 shadow-xl">
              <PortfolioTable
                positions={filteredPositions}
                onEdit={openEditModal}
                onDelete={handleDeletePosition}
                onAlert={openAlertModal}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <AddPositionModal open={showAddPosition} onClose={() => setShowAddPosition(false)} onAdd={handleAddPosition} />

      <EditPositionModal
        open={showEditPosition}
        onClose={() => {
          setShowEditPosition(false)
          setEditingPosition(null)
        }}
        position={editingPosition}
        onEdit={handleEditPosition}
      />

      <AlertModal
        open={showAlertModal}
        onClose={() => {
          setShowAlertModal(false)
          setAlertPosition(null)
        }}
        position={alertPosition}
        onAddAlert={addAlert}
      />

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <AdminLoginModal open={showAdminLogin} onClose={() => setShowAdminLogin(false)} />

      <AdminPanel open={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

      <NotificationCenter
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        alerts={alerts}
        portfolios={portfolios}
        onUpdateAlert={updateAlert}
        onDeleteAlert={deleteAlert}
      />

      {/* Delete Position Confirmation */}
      <DeleteConfirmModal
        open={showDeletePosition}
        onClose={() => {
          setShowDeletePosition(false)
          setDeletingPosition(null)
        }}
        onConfirm={confirmDeletePosition}
        title="Delete Position"
        description={
          deletingPosition
            ? `Are you sure you want to delete ${deletingPosition.tokenSymbol} (${deletingPosition.tokenName}) from your portfolio?`
            : ""
        }
      />

      {/* Delete Portfolio Confirmation */}
      <DeleteConfirmModal
        open={showDeletePortfolio}
        onClose={() => {
          setShowDeletePortfolio(false)
          setDeletingPortfolio(null)
        }}
        onConfirm={confirmDeletePortfolio}
        title="Delete Portfolio"
        description={
          deletingPortfolio
            ? `Are you sure you want to delete "${deletingPortfolio.name}" portfolio? This will remove all ${deletingPortfolio.positions.length} positions.`
            : ""
        }
      />

      <Toaster />
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <PortfolioApp />
      </LanguageProvider>
    </ThemeProvider>
  )
}
