"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react"
import { useAdmin } from "@/hooks/use-admin"

interface AdminLoginModalProps {
  open: boolean
  onClose: () => void
}

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const { login, sendPasswordReset } = useAdmin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError("")

    try {
      const success = await login(password)
      if (success) {
        onClose()
        setPassword("")
      } else {
        setError("Invalid admin password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    try {
      const success = await sendPasswordReset()
      if (success) {
        setResetEmailSent(true)
        setError("")
      } else {
        setError("Failed to send password reset email")
      }
    } catch (error) {
      setError("Failed to send password reset email")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setShowForgotPassword(false)
    setResetEmailSent(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5" />
            Admin Login
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForgotPassword ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="adminPassword" className="text-sm font-medium">
                    Admin Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                      className="bg-background/50 backdrop-blur-sm border-border/50 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-border/50 bg-transparent"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot Password?
                </Button>
              </div>
            </>
          ) : (
            <>
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                    <Mail className="h-4 w-4" />
                    Password reset email sent to admin email address
                  </div>
                  <Button onClick={handleClose} className="w-full">
                    Close
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Reset Admin Password</h3>
                    <p className="text-sm text-muted-foreground">
                      A password reset link will be sent to the configured admin email address.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={handleForgotPassword} disabled={loading} className="flex-1">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? "Sending..." : "Send Reset Email"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 border-border/50"
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
