"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface EmailAddress {
  address: string
  verified: boolean
  addedAt: Date
}

interface EmailSettings {
  enabled: boolean
  emailAddresses: EmailAddress[]
}

export function useEmailNotifications() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    enabled: false,
    emailAddresses: [],
  })
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadEmailSettings()
    }
  }, [isAuthenticated, user, authLoading])

  const loadEmailSettings = async () => {
    try {
      let settings: EmailSettings = {
        enabled: false,
        emailAddresses: [],
      }

      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Load from Supabase
        const { data, error } = await supabase.from("email_settings").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading email settings from Supabase:", error)
          const savedSettings = localStorage.getItem("crypto-email-settings")
          if (savedSettings) {
            settings = JSON.parse(savedSettings)
          }
        } else if (data) {
          settings = {
            enabled: data.enabled,
            emailAddresses: data.email_addresses || [],
          }
        }
      } else {
        // Load from localStorage
        const savedSettings = localStorage.getItem("crypto-email-settings")
        if (savedSettings) {
          settings = JSON.parse(savedSettings)
        }
      }

      setEmailSettings(settings)
    } catch (error) {
      console.error("Error loading email settings:", error)
    }
  }

  const saveEmailSettings = async (settings: EmailSettings) => {
    try {
      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Save to Supabase
        const { error } = await supabase.from("email_settings").upsert({
          user_id: user.id,
          enabled: settings.enabled,
          email_addresses: settings.emailAddresses,
        })

        if (error) {
          console.error("Error saving email settings to Supabase:", error)
          localStorage.setItem("crypto-email-settings", JSON.stringify(settings))
        }
      } else {
        // Save to localStorage
        localStorage.setItem("crypto-email-settings", JSON.stringify(settings))
      }

      setEmailSettings(settings)
    } catch (error) {
      console.error("Error saving email settings:", error)
      localStorage.setItem("crypto-email-settings", JSON.stringify(settings))
    }
  }

  const updateEmailSettings = (updates: Partial<EmailSettings>) => {
    const newSettings = { ...emailSettings, ...updates }
    saveEmailSettings(newSettings)
  }

  const addEmailAddress = async (email: string) => {
    const newEmailAddress: EmailAddress = {
      address: email,
      verified: true, // For demo purposes, auto-verify
      addedAt: new Date(),
    }

    const updatedSettings = {
      ...emailSettings,
      emailAddresses: [...emailSettings.emailAddresses, newEmailAddress],
    }

    await saveEmailSettings(updatedSettings)
  }

  const removeEmailAddress = async (email: string) => {
    const updatedSettings = {
      ...emailSettings,
      emailAddresses: emailSettings.emailAddresses.filter((e) => e.address !== email),
    }

    await saveEmailSettings(updatedSettings)
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const sendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      console.log(`Sending verification email to: ${email}`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return true
    } catch (error) {
      console.error("Error sending verification email:", error)
      return false
    }
  }

  const sendPriceAlert = async (
    tokenSymbol: string,
    targetPrice: number,
    currentPrice: number,
    alertType = "price",
  ): Promise<boolean> => {
    if (!emailSettings.enabled) {
      return false
    }

    const verifiedEmails = emailSettings.emailAddresses?.filter((e) => e.verified) || []
    if (verifiedEmails.length === 0) {
      return false
    }

    try {
      const direction = currentPrice >= targetPrice ? "above" : "below"
      const emoji = currentPrice >= targetPrice ? "🚀" : "📉"

      // Send to all verified email addresses
      const emailPromises = verifiedEmails.map(async (emailAddr) => {
        const emailData = {
          to: emailAddr.address,
          subject: `${emoji} ${tokenSymbol} ${alertType.toUpperCase()} Alert - ${direction.toUpperCase()} Target`,
          html: generateEmailHTML(tokenSymbol, targetPrice, currentPrice, direction, emoji, alertType),
          text: generateEmailText(tokenSymbol, targetPrice, currentPrice, direction, emoji, alertType),
        }

        console.log(`Sending email alert to ${emailAddr.address}:`, emailData)
        await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate API call
        return true
      })

      await Promise.all(emailPromises)
      return true
    } catch (error) {
      console.error("Error sending email alerts:", error)
      return false
    }
  }

  const generateEmailHTML = (
    tokenSymbol: string,
    targetPrice: number,
    currentPrice: number,
    direction: string,
    emoji: string,
    alertType: string,
  ): string => {
    const changePercent = (((currentPrice - targetPrice) / targetPrice) * 100).toFixed(2)
    const isPositive = currentPrice >= targetPrice

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${tokenSymbol} ${alertType.toUpperCase()} Alert</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px 20px; }
            .alert-box { background: ${isPositive ? "#f0f9ff" : "#fef2f2"}; border: 2px solid ${isPositive ? "#3b82f6" : "#ef4444"}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .token-info { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
            .price-info { font-size: 16px; color: #6b7280; margin: 5px 0; }
            .price-change { font-size: 20px; font-weight: 700; color: ${isPositive ? "#059669" : "#dc2626"}; margin: 10px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .timestamp { color: #9ca3af; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} ${tokenSymbol} ${alertType.toUpperCase()} Alert</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <div class="token-info">${tokenSymbol} is now ${direction} your target!</div>
                <div class="price-info">Target: $${targetPrice.toFixed(6)}</div>
                <div class="price-info">Current: $${currentPrice.toFixed(6)}</div>
                <div class="price-change">
                  ${isPositive ? "+" : ""}${changePercent}% from target
                </div>
              </div>
              <p>Your ${alertType} alert for <strong>${tokenSymbol}</strong> has been triggered. The current price of $${currentPrice.toFixed(6)} is ${direction} your target of $${targetPrice.toFixed(6)}.</p>
              <div class="timestamp">
                Alert triggered at: ${new Date().toLocaleString()}
              </div>
            </div>
            <div class="footer">
              <p>This alert was sent from your Crypto Portfolio Tracker.</p>
              <p>You can manage your alert settings in the application.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const generateEmailText = (
    tokenSymbol: string,
    targetPrice: number,
    currentPrice: number,
    direction: string,
    emoji: string,
    alertType: string,
  ): string => {
    const changePercent = (((currentPrice - targetPrice) / targetPrice) * 100).toFixed(2)

    return `
${emoji} ${tokenSymbol} ${alertType.toUpperCase()} Alert

Your ${alertType} alert for ${tokenSymbol} has been triggered!

Target: $${targetPrice.toFixed(6)}
Current: $${currentPrice.toFixed(6)}
Change: ${currentPrice >= targetPrice ? "+" : ""}${changePercent}% from target

The current price of $${currentPrice.toFixed(6)} is ${direction} your target of $${targetPrice.toFixed(6)}.

Alert triggered at: ${new Date().toLocaleString()}

---
This alert was sent from your Crypto Portfolio Tracker.
You can manage your alert settings in the application.
    `.trim()
  }

  return {
    emailSettings,
    updateEmailSettings,
    addEmailAddress,
    removeEmailAddress,
    validateEmail,
    sendVerificationEmail,
    sendPriceAlert,
  }
}
