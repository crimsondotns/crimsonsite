"use client"

import { useState, useEffect } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // If Supabase is not configured, use demo mode
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUserFromSupabaseUser(session.user)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserFromSupabaseUser(session.user)

        // Migrate local data when user logs in
        if (event === "SIGNED_IN") {
          await migrateLocalData(session.user.id)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const setUserFromSupabaseUser = (supabaseUser: User) => {
    const authUser: AuthUser = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User",
      email: supabaseUser.email || "",
      avatar: supabaseUser.user_metadata?.avatar_url,
    }
    setUser(authUser)
    setIsAuthenticated(true)
  }

  const login = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Authentication is not configured. Please set up Supabase environment variables.")
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Login error:", error)
        throw error
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Logout error:", error)
        throw error
      }
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const migrateLocalData = async (userId: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    try {
      // Migrate portfolios
      const localPortfolios = localStorage.getItem("crypto-portfolios")
      if (localPortfolios) {
        const portfolios = JSON.parse(localPortfolios)

        // Save to Supabase
        for (const portfolio of portfolios) {
          const { error } = await supabase.from("portfolios").upsert({
            id: portfolio.id,
            user_id: userId,
            name: portfolio.name,
            positions: portfolio.positions,
            created_at: portfolio.createdAt,
            updated_at: portfolio.updatedAt,
          })

          if (error) {
            console.error("Error migrating portfolio:", error)
          }
        }

        // Clear local storage after successful migration
        localStorage.removeItem("crypto-portfolios")
      }

      // Migrate alerts
      const localAlerts = localStorage.getItem("crypto-alerts")
      if (localAlerts) {
        const alerts = JSON.parse(localAlerts)

        for (const alert of alerts) {
          const { error } = await supabase.from("alerts").upsert({
            id: alert.id,
            user_id: userId,
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
            created_at: alert.createdAt,
            last_triggered: alert.lastTriggered,
          })

          if (error) {
            console.error("Error migrating alert:", error)
          }
        }

        localStorage.removeItem("crypto-alerts")
      }

      // Migrate email settings
      const localEmailSettings = localStorage.getItem("crypto-email-settings")
      if (localEmailSettings) {
        const emailSettings = JSON.parse(localEmailSettings)

        const { error } = await supabase.from("email_settings").upsert({
          user_id: userId,
          enabled: emailSettings.enabled,
          email_address: emailSettings.emailAddress,
          verified: emailSettings.verified,
        })

        if (error) {
          console.error("Error migrating email settings:", error)
        } else {
          localStorage.removeItem("crypto-email-settings")
        }
      }

      console.log("Local data migration completed")
    } catch (error) {
      console.error("Error migrating local data:", error)
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    isSupabaseConfigured,
  }
}
