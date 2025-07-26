"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Folder,
  MoreHorizontal,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Portfolio {
  id: string
  name: string
  positions: any[]
}

interface PortfolioSidebarProps {
  portfolios: Portfolio[]
  activePortfolio: string
  onPortfolioChange: (id: string) => void
  onAddPortfolio: (name: string) => void
  onDeletePortfolio: (id: string) => void
  onUpdatePortfolio: (id: string, updates: any) => void
}

export function PortfolioSidebar({
  portfolios,
  activePortfolio,
  onPortfolioChange,
  onAddPortfolio,
  onDeletePortfolio,
  onUpdatePortfolio,
}: PortfolioSidebarProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPortfolioName, setNewPortfolioName] = useState("")
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { t } = useLanguage()

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
  }

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return

    await onAddPortfolio(newPortfolioName)
    setNewPortfolioName("")
    setShowCreateDialog(false)
  }

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (portfolios.length <= 1) {
      alert(t.cannotDeleteLast)
      return
    }

    await onDeletePortfolio(portfolioId)
  }

  const handleEditPortfolio = async (portfolioId: string, newName: string) => {
    if (!newName.trim()) return

    await onUpdatePortfolio(portfolioId, { name: newName })
    setEditingPortfolio(null)
    setEditName("")
  }

  const startEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio.id)
    setEditName(portfolio.name)
  }

  const totalValue = portfolios.reduce((acc, portfolio) => {
    return (
      acc +
      portfolio.positions.reduce((posAcc, pos) => {
        return posAcc + pos.currentPrice * pos.quantity
      }, 0)
    )
  }, 0)

  const totalPnL = portfolios.reduce((acc, portfolio) => {
    return (
      acc +
      portfolio.positions.reduce((posAcc, pos) => {
        return posAcc + pos.profitLoss
      }, 0)
    )
  }, 0)

  return (
    <TooltipProvider>
      <div
        className={`border-r border-border/50 bg-background/50 backdrop-blur-md flex flex-col animate-fade-in transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            {!isCollapsed && <h2 className="text-lg font-semibold">{t.portfolio}</h2>}

            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in">
                    <DialogHeader>
                      <DialogTitle>{t.createPortfolio}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder={t.portfolioName}
                        value={newPortfolioName}
                        onChange={(e) => setNewPortfolioName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
                        className="bg-background/50 backdrop-blur-sm border-border/50"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreatePortfolio} className="flex-1">
                          {t.save}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          className="flex-1 border-border/50"
                        >
                          {t.cancel}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleCollapsed}
                    className="bg-background/50 backdrop-blur-sm border-border/50"
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{isCollapsed ? "Expand menu" : "Collapse menu"}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Portfolio Stats */}
          {!isCollapsed && (
            <div className="space-y-3 p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t.totalValue}:</span>
                <span className="font-mono font-medium">${totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t.totalPnL}:</span>
                <div
                  className={`flex items-center gap-1 font-mono font-medium ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Add Button */}
          {isCollapsed && (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-background/50 backdrop-blur-sm border-border/50 w-8 h-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t.createPortfolio}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Portfolio List */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {portfolios.map((portfolio) => {
            const portfolioValue = portfolio.positions.reduce((acc, pos) => acc + pos.currentPrice * pos.quantity, 0)
            const portfolioPnL = portfolio.positions.reduce((acc, pos) => acc + pos.profitLoss, 0)

            if (isCollapsed) {
              return (
                <Tooltip key={portfolio.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        activePortfolio === portfolio.id
                          ? "bg-primary/10 border border-primary/20 shadow-sm"
                          : "hover:bg-muted/30 border border-transparent"
                      }`}
                      onClick={() => onPortfolioChange(portfolio.id)}
                    >
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <div className="font-medium">{portfolio.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {portfolio.positions.length} {t.positions}
                      </div>
                      <div className="text-xs font-mono">
                        <span className="text-muted-foreground">${portfolioValue.toLocaleString()}</span>
                        <span className={`ml-2 ${portfolioPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {portfolioPnL >= 0 ? "+" : ""}${portfolioPnL.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div
                key={portfolio.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  activePortfolio === portfolio.id
                    ? "bg-primary/10 border border-primary/20 shadow-sm"
                    : "hover:bg-muted/30 border border-transparent"
                }`}
                onClick={() => onPortfolioChange(portfolio.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {editingPortfolio === portfolio.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleEditPortfolio(portfolio.id, editName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditPortfolio(portfolio.id, editName)
                          } else if (e.key === "Escape") {
                            setEditingPortfolio(null)
                            setEditName("")
                          }
                        }}
                        className="h-6 text-sm bg-background/50 border-border/50"
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="font-medium text-sm truncate">{portfolio.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {portfolio.positions.length} {t.positions}
                        </div>
                        <div className="text-xs font-mono">
                          <span className="text-muted-foreground">${portfolioValue.toLocaleString()}</span>
                          <span className={`ml-2 ${portfolioPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {portfolioPnL >= 0 ? "+" : ""}${portfolioPnL.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border-border/50">
                    <DropdownMenuItem onClick={() => startEdit(portfolio)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t.edit}
                    </DropdownMenuItem>
                    {portfolios.length > 1 && (
                      <DropdownMenuItem onClick={() => handleDeletePortfolio(portfolio.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.delete}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
