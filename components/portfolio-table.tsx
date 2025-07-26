"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Edit, Trash2, TrendingUp, TrendingDown, Bell } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
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

interface PortfolioTableProps {
  positions: Position[]
  onEdit: (position: Position) => void
  onDelete: (positionId: string) => void
  onAlert: (position: Position) => void
}

type SortField =
  | "tokenName"
  | "network"
  | "currentPrice"
  | "quantity"
  | "investedAmount"
  | "averagePrice"
  | "profitLoss"
type SortDirection = "asc" | "desc"

export function PortfolioTable({ positions, onEdit, onDelete, onAlert }: PortfolioTableProps) {
  const [sortField, setSortField] = useState<SortField>("profitLoss")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const { t } = useLanguage()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedPositions = [...positions].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
    </Button>
  )

  const handleDeleteClick = (positionId: string) => {
    onDelete(positionId)
  }

  if (positions.length === 0) {
    return (
      <div className="p-12 text-center animate-fade-in">
        <div className="text-lg font-medium text-muted-foreground mb-2">{t.noPositions}</div>
        <div className="text-sm text-muted-foreground">{t.addFirstPosition}</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/50 hover:bg-transparent">
            <TableHead className="font-semibold">
              <SortButton field="tokenName">{t.token}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="network">{t.network}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="currentPrice">{t.price}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="quantity">{t.quantity}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="investedAmount">{t.invested}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="averagePrice">{t.avgPrice}</SortButton>
            </TableHead>
            <TableHead className="font-semibold">
              <SortButton field="profitLoss">{t.profitLoss}</SortButton>
            </TableHead>
            <TableHead className="font-semibold w-[120px]">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position, index) => (
            <TableRow
              key={position.id}
              className="border-b border-border/30 hover:bg-muted/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  {position.logoUrl ? (
                    <img
                      src={position.logoUrl || "/placeholder.svg"}
                      alt={position.tokenSymbol}
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
                      position.logoUrl ? "hidden" : ""
                    }`}
                  >
                    {position.tokenSymbol.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{position.tokenSymbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">{position.tokenName}</div>
                    <CopyButton text={position.contractAddress} showFullAddress />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/50 capitalize border border-border/30">
                  {position.network}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm">${position.currentPrice.toFixed(6)}</TableCell>
              <TableCell className="font-mono text-sm">{position.quantity.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-sm">${position.investedAmount.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-sm">${position.averagePrice.toFixed(6)}</TableCell>
              <TableCell>
                <div
                  className={`flex items-center gap-2 ${position.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {position.profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <div className="text-right">
                    <div className="font-mono font-medium text-sm">
                      {position.profitLoss >= 0 ? "▲" : "▼"} {position.profitLoss >= 0 ? "+" : ""}$
                      {Math.abs(position.profitLoss).toLocaleString()}
                    </div>
                    <div className="text-xs font-mono opacity-80">
                      ({position.profitLoss >= 0 ? "+" : ""}
                      {position.profitLossPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAlert(position)}
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                    title={t.alert}
                  >
                    <Bell className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(position)}
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                    title={t.edit}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(position.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    title={t.delete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
