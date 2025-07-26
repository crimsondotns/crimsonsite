"use client"

import { useState, useEffect } from "react"

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported("Notification" in window)
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") return

    try {
      const notification = new Notification(title, {
        icon: "/placeholder.svg?height=64&width=64",
        badge: "/placeholder.svg?height=32&width=32",
        tag: "crypto-alert",
        requireInteraction: true,
        ...options,
      })

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close()
      }, 10000)

      return notification
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }

  const showPriceAlert = (tokenSymbol: string, targetPrice: number, currentPrice: number) => {
    const direction = currentPrice >= targetPrice ? "above" : "below"
    const emoji = currentPrice >= targetPrice ? "🚀" : "📉"

    return showNotification(`${emoji} ${tokenSymbol} Price Alert`, {
      body: `${tokenSymbol} is now ${direction} your target price of $${targetPrice.toFixed(6)}\nCurrent price: $${currentPrice.toFixed(6)}`,
      data: {
        tokenSymbol,
        targetPrice,
        currentPrice,
        timestamp: Date.now(),
      },
    })
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showPriceAlert,
  }
}
