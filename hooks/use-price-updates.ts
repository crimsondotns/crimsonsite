"use client"

import { useEffect, useRef } from "react"
import { useSoundManager } from "@/hooks/use-sound-manager"
import { useBrowserNotifications } from "@/hooks/use-browser-notifications"
import { useEmailNotifications } from "@/hooks/use-email-notifications"

export function usePriceUpdates(portfolios: any[], updatePosition: any, alerts: any[], onAlertTriggered: any) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPricesRef = useRef<Record<string, number>>({})

  const { playSound } = useSoundManager()
  const { showPriceAlert } = useBrowserNotifications()
  const { sendPriceAlert } = useEmailNotifications()

  useEffect(() => {
    const updatePrices = async () => {
      for (const portfolio of portfolios) {
        for (const position of portfolio.positions) {
          try {
            // Add delay between requests to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100))

            const response = await fetch(
              `https://api.dexscreener.com/latest/dex/search?q=${position.contractAddress}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                },
              },
            )

            if (!response.ok) {
              console.warn(`HTTP ${response.status} for ${position.tokenSymbol}:`, response.statusText)
              continue
            }

            const data = await response.json()

            if (data.pairs && data.pairs.length > 0) {
              const newPrice = Number.parseFloat(data.pairs[0].priceUsd || "0")

              if (newPrice > 0) {
                const oldPrice = lastPricesRef.current[position.contractAddress] || position.currentPrice

                if (Math.abs(newPrice - position.currentPrice) > 0.000001) {
                  // Only update if price changed significantly
                  const currentValue = newPrice * position.quantity
                  const profitLoss = currentValue - position.investedAmount
                  const profitLossPercent = ((newPrice - position.averagePrice) / position.averagePrice) * 100

                  await updatePosition(portfolio.id, {
                    ...position,
                    currentPrice: newPrice,
                    profitLoss,
                    profitLossPercent,
                  })

                  // Check alerts for this position
                  const positionAlerts = alerts.filter((alert) => alert.positionId === position.id && !alert.triggered)

                  for (const alert of positionAlerts) {
                    if (shouldTriggerAlert(oldPrice, newPrice, alert.targetPrice)) {
                      // Play sound alert with error handling
                      if (alert.soundEnabled) {
                        try {
                          await playSound(alert.soundFile || "default", alert.volume || 0.5)
                        } catch (error) {
                          console.warn("Failed to play alert sound:", error)
                        }
                      }

                      // Show browser notification
                      if (alert.browserNotification) {
                        try {
                          showPriceAlert(alert.tokenSymbol, alert.targetPrice, newPrice)
                        } catch (error) {
                          console.warn("Failed to show browser notification:", error)
                        }
                      }

                      // Send email notification
                      if (alert.emailNotification && alert.emailAddress) {
                        try {
                          await sendPriceAlert(alert.tokenSymbol, alert.targetPrice, newPrice, alert.emailAddress)
                        } catch (error) {
                          console.warn("Failed to send email notification:", error)
                        }
                      }

                      onAlertTriggered({
                        ...alert,
                        currentPrice: newPrice,
                      })
                    }
                  }

                  lastPricesRef.current[position.contractAddress] = newPrice
                }
              } else {
                console.warn(`Invalid price (${newPrice}) for ${position.tokenSymbol}`)
              }
            } else {
              console.warn(`No pairs found for ${position.tokenSymbol} (${position.contractAddress})`)
            }
          } catch (error) {
            console.warn(`Error updating price for ${position.tokenSymbol}:`, error.message || error)
            // Continue with next position instead of breaking the entire update
            continue
          }
        }
      }
    }

    // Update prices every 30 seconds instead of 10 to reduce rate limiting
    intervalRef.current = setInterval(updatePrices, 30000)

    // Initial update
    updatePrices()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [portfolios, updatePosition, alerts, onAlertTriggered, playSound, showPriceAlert, sendPriceAlert])
}

function shouldTriggerAlert(oldPrice: number, newPrice: number, targetPrice: number): boolean {
  // Check if price crossed the target (from either direction)
  return (oldPrice < targetPrice && newPrice >= targetPrice) || (oldPrice > targetPrice && newPrice <= targetPrice)
}
