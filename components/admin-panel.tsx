"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Upload, AlertCircle, CheckCircle, LogOut, Download } from "lucide-react"
import { useAdmin } from "@/hooks/use-admin"
import { usePortfolio } from "@/hooks/use-portfolio"
import { useAlerts } from "@/hooks/use-alerts"

interface AdminPanelProps {
  open: boolean
  onClose: () => void
}

interface ImportData {
  addPosition?: any[]
  addAlerts?: any[]
}

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [jsonInput, setJsonInput] = useState("")
  const [importResult, setImportResult] = useState<string>("")
  const [importError, setImportError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const { logout } = useAdmin()
  const { addPosition, portfolios } = usePortfolio()
  const { addAlert } = useAlerts()

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setImportError("Please enter JSON data")
      return
    }

    setLoading(true)
    setImportError("")
    setImportResult("")

    try {
      const importData: ImportData = JSON.parse(jsonInput)
      const results: string[] = []

      // Import positions
      if (importData.addPosition && Array.isArray(importData.addPosition)) {
        const defaultPortfolio = portfolios[0]?.id || "default"

        for (const position of importData.addPosition) {
          try {
            await addPosition(defaultPortfolio, {
              contractAddress: position.contractAddress,
              tokenName: position.tokenName,
              tokenSymbol: position.tokenSymbol,
              network: position.network || "ethereum",
              quantity: position.quantity,
              investedAmount: position.investedAmount,
              averagePrice: position.averagePrice || position.investedAmount / position.quantity,
              currentPrice: position.currentPrice || 0,
              profitLoss: position.profitLoss || 0,
              profitLossPercent: position.profitLossPercent || 0,
              logoUrl: position.logoUrl,
            })
            results.push(`✅ Added position: ${position.tokenSymbol}`)
          } catch (error) {
            results.push(`❌ Failed to add position: ${position.tokenSymbol} - ${error}`)
          }
        }
      }

      // Import alerts
      if (importData.addAlerts && Array.isArray(importData.addAlerts)) {
        for (const alert of importData.addAlerts) {
          try {
            await addAlert({
              positionId: alert.positionId,
              tokenSymbol: alert.tokenSymbol,
              tokenName: alert.tokenName,
              contractAddress: alert.contractAddress,
              targetPrice: alert.targetPrice,
              alertType: alert.alertType || "price",
              percentageValue: alert.percentageValue,
              isOneTime: alert.isOneTime !== false,
              soundEnabled: alert.soundEnabled !== false,
              soundFile: alert.soundFile || "default",
              volume: alert.volume || 0.5,
              browserNotification: alert.browserNotification || false,
              emailNotification: alert.emailNotification || false,
            })
            results.push(`✅ Added alert: ${alert.tokenSymbol} at $${alert.targetPrice}`)
          } catch (error) {
            results.push(`❌ Failed to add alert: ${alert.tokenSymbol} - ${error}`)
          }
        }
      }

      setImportResult(results.join("\n"))
    } catch (error) {
      setImportError(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportTemplate = () => {
    const template = {
      addPosition: [
        {
          contractAddress: "0x1234567890123456789012345678901234567890",
          tokenName: "Example Token",
          tokenSymbol: "EXAMPLE",
          network: "ethereum",
          quantity: 1000,
          investedAmount: 100,
          averagePrice: 0.1,
          currentPrice: 0.12,
          profitLoss: 20,
          profitLossPercent: 20,
          logoUrl: "https://example.com/logo.png",
        },
      ],
      addAlerts: [
        {
          positionId: "position_id_here",
          tokenSymbol: "EXAMPLE",
          tokenName: "Example Token",
          contractAddress: "0x1234567890123456789012345678901234567890",
          targetPrice: 0.15,
          alertType: "price",
          percentageValue: null,
          isOneTime: true,
          soundEnabled: true,
          soundFile: "default",
          volume: 0.5,
          browserNotification: true,
          emailNotification: false,
        },
      ],
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "import-template.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  const handleClose = () => {
    setJsonInput("")
    setImportResult("")
    setImportError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-4xl max-h-[90vh] p-0">
        <div className="modal-scrollable hidden-scrollbar p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" />
                Admin Panel
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-border/50 bg-transparent">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="import" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">JSON Import</TabsTrigger>
              <TabsTrigger value="export">Export Template</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jsonInput" className="text-sm font-medium">
                    Import JSON Data
                  </Label>
                  <Textarea
                    id="jsonInput"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`{
  "addPosition": [
    {
      "contractAddress": "0x...",
      "tokenName": "Token Name",
      "tokenSymbol": "SYMBOL",
      "network": "ethereum",
      "quantity": 1000,
      "investedAmount": 100,
      "averagePrice": 0.1
    }
  ],
  "addAlerts": [
    {
      "positionId": "position_id",
      "tokenSymbol": "SYMBOL",
      "tokenName": "Token Name",
      "contractAddress": "0x...",
      "targetPrice": 0.15,
      "alertType": "price"
    }
  ]
}`}
                    className="mt-1 bg-background/50 backdrop-blur-sm border-border/50 font-mono text-sm min-h-[300px]"
                  />
                </div>

                {importError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {importError}
                  </div>
                )}

                {importResult && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Import Results:</span>
                    </div>
                    <pre className="text-xs text-green-600 dark:text-green-500 whitespace-pre-wrap font-mono">
                      {importResult}
                    </pre>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleImport} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setJsonInput("")
                      setImportResult("")
                      setImportError("")
                    }}
                    className="border-border/50 bg-transparent"
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <div className="font-medium mb-2">JSON Import Template</div>
                    <p className="mb-3">
                      Download a template file with the correct JSON structure for importing positions and alerts.
                    </p>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>addPosition:</strong> Array of token positions to add to the default portfolio
                      </div>
                      <div>
                        <strong>addAlerts:</strong> Array of price/percentage alerts to create
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleExportTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Import Template
                </Button>

                <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
                  <h4 className="font-medium text-sm mb-2">Template Structure:</h4>
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                    {`{
  "addPosition": [
    {
      "contractAddress": "0x...",
      "tokenName": "Token Name",
      "tokenSymbol": "SYMBOL",
      "network": "ethereum",
      "quantity": 1000,
      "investedAmount": 100,
      "averagePrice": 0.1,
      "currentPrice": 0.12,
      "profitLoss": 20,
      "profitLossPercent": 20,
      "logoUrl": "https://..."
    }
  ],
  "addAlerts": [
    {
      "positionId": "position_id",
      "tokenSymbol": "SYMBOL",
      "tokenName": "Token Name",
      "contractAddress": "0x...",
      "targetPrice": 0.15,
      "alertType": "price",
      "percentageValue": null,
      "isOneTime": true,
      "soundEnabled": true,
      "browserNotification": true,
      "emailNotification": false
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
