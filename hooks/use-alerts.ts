"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Alert {
  id: string
  positionId: string
  tokenSymbol: string
  tokenName: string
  contractAddress: string
  targetPrice: number
  isOneTime: boolean
  soundEnabled: boolean
  soundFile?: string
  volume: number
  browserNotification: boolean
  emailNotification: boolean
  emailAddress?: string
  triggered: boolean
  createdAt: Date
  lastTriggered?: Date
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadAlerts()
    }
  }, [isAuthenticated, user, authLoading])

  const loadAlerts = async () => {
    try {
      let savedAlerts: Alert[] = []

      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Load from Supabase
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading alerts from Supabase:", error)
          // Fallback to localStorage if Supabase fails
          const savedData = localStorage.getItem("crypto-alerts")
          if (savedData) {
            savedAlerts = JSON.parse(savedData)
          }
        } else {
          savedAlerts = data.map((alert) => ({
            id: alert.id,
            positionId: alert.position_id,
            tokenSymbol: alert.token_symbol,
            tokenName: alert.token_name,
            contractAddress: alert.contract_address,
            targetPrice: alert.target_price,
            isOneTime: alert.is_one_time,
            soundEnabled: alert.sound_enabled,
            soundFile: alert.sound_file,
            volume: alert.volume,
            browserNotification: alert.browser_notification,
            emailNotification: alert.email_notification,
            emailAddress: alert.email_address,
            triggered: alert.triggered,
            createdAt: new Date(alert.created_at),
            lastTriggered: alert.last_triggered ? new Date(alert.last_triggered) : undefined,
          }))
        }
      } else {
        // Load from localStorage
        const savedData = localStorage.getItem("crypto-alerts")
        if (savedData) {
          savedAlerts = JSON.parse(savedData)
        }
      }

      setAlerts(savedAlerts)
    } catch (error) {
      console.error("Error loading alerts:", error)
    }
  }

  const saveAlerts = async (updatedAlerts: Alert[]) => {
    try {
      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Save to Supabase
        for (const alert of updatedAlerts) {
          const { error } = await supabase.from("alerts").upsert({
            id: alert.id,
            user_id: user.id,
            position_id: alert.positionId,
            token_symbol: alert.tokenSymbol,
            token_name: alert.tokenName,
            contract_address: alert.contractAddress,
            target_price: alert.targetPrice,
            is_one_time: alert.isOneTime,
            sound_enabled: alert.soundEnabled,
            sound_file: alert.soundFile,
            volume: alert.volume,
            browser_notification: alert.browserNotification,
            email_notification: alert.emailNotification,
            email_address: alert.emailAddress,
            triggered: alert.triggered,
            created_at: alert.createdAt.toISOString(),
            last_triggered: alert.lastTriggered?.toISOString(),
          })

          if (error) {
            console.error("Error saving alert to Supabase:", error)
            // Fallback to localStorage if Supabase fails
            localStorage.setItem("crypto-alerts", JSON.stringify(updatedAlerts))
          }
        }
      } else {
        // Save to localStorage
        localStorage.setItem("crypto-alerts", JSON.stringify(updatedAlerts))
      }
    } catch (error) {
      console.error("Error saving alerts:", error)
      // Always fallback to localStorage
      localStorage.setItem("crypto-alerts", JSON.stringify(updatedAlerts))
    }
  }

  const addAlert = async (alertData: Omit<Alert, "id" | "createdAt" | "triggered">) => {
    const newAlert: Alert = {
      ...alertData,
      id: Date.now().toString(),
      createdAt: new Date(),
      triggered: false,
      volume: alertData.volume || 0.5,
      browserNotification: alertData.browserNotification || false,
      emailNotification: alertData.emailNotification || false,
    }

    const updatedAlerts = [...alerts, newAlert]
    setAlerts(updatedAlerts)
    await saveAlerts(updatedAlerts)
  }

  const updateAlert = async (alertId: string, updates: Partial<Alert>) => {
    const updatedAlerts = alerts.map((alert) => (alert.id === alertId ? { ...alert, ...updates } : alert))
    setAlerts(updatedAlerts)
    await saveAlerts(updatedAlerts)
  }

  const deleteAlert = async (alertId: string) => {
    const updatedAlerts = alerts.filter((alert) => alert.id !== alertId)
    setAlerts(updatedAlerts)
    await saveAlerts(updatedAlerts)

    // Also delete from Supabase if authenticated
    if (isAuthenticated && user && isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("alerts").delete().eq("id", alertId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting alert from Supabase:", error)
      }
    }
  }

  const triggerAlert = async (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId)
    if (!alert) return

    const updates: Partial<Alert> = {
      lastTriggered: new Date(),
    }

    if (alert.isOneTime) {
      updates.triggered = true
    }

    await updateAlert(alertId, updates)
  }

  return {
    alerts,
    addAlert,
    updateAlert,
    deleteAlert,
    triggerAlert,
  }
}
