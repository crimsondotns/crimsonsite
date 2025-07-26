"use client"

import { useState, useEffect } from "react"

interface AdminUser {
  id: string
  isAdmin: boolean
  loginTime: Date
}

// Admin configuration - in production, these should be environment variables
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@cryptoportfolio.com"

export function useAdmin() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if admin is already logged in
    const savedAdmin = localStorage.getItem("crypto-admin-session")
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin)
        const loginTime = new Date(adminData.loginTime)
        const now = new Date()

        // Session expires after 24 hours
        if (now.getTime() - loginTime.getTime() < 24 * 60 * 60 * 1000) {
          setAdminUser(adminData)
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("crypto-admin-session")
        }
      } catch (error) {
        localStorage.removeItem("crypto-admin-session")
      }
    }
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      // In production, this should be a secure API call
      if (password === ADMIN_PASSWORD) {
        const adminData: AdminUser = {
          id: "admin",
          isAdmin: true,
          loginTime: new Date(),
        }

        setAdminUser(adminData)
        setIsAuthenticated(true)
        localStorage.setItem("crypto-admin-session", JSON.stringify(adminData))
        return true
      }
      return false
    } catch (error) {
      console.error("Admin login error:", error)
      return false
    }
  }

  const logout = () => {
    setAdminUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("crypto-admin-session")
  }

  const sendPasswordReset = async (): Promise<boolean> => {
    try {
      // In production, this would call your backend API to send reset email
      console.log(`Sending password reset email to: ${ADMIN_EMAIL}`)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, log the reset token
      const resetToken = Math.random().toString(36).substring(2, 15)
      console.log(`Password reset token: ${resetToken}`)

      return true
    } catch (error) {
      console.error("Error sending password reset:", error)
      return false
    }
  }

  return {
    adminUser,
    isAuthenticated,
    login,
    logout,
    sendPasswordReset,
  }
}
