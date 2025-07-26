"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User, Loader2, Cloud, HardDrive, AlertTriangle } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const { user, isAuthenticated, login, logout, isSupabaseConfigured } = useAuth()

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      return
    }

    setLoading(true)
    try {
      await login()
      // Modal will close automatically when auth state changes
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" />
            {isAuthenticated ? "Account" : t.login}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isSupabaseConfigured ? (
            // Show demo mode message when Supabase is not configured
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Demo Mode</span>
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-500">
                Authentication is not configured. Your data is stored locally in your browser.
              </div>
              <div className="text-xs mt-2 text-orange-500 dark:text-orange-600">
                To enable cloud sync, configure Supabase environment variables.
              </div>
            </div>
          ) : !isAuthenticated ? (
            <>
              <div className="text-center text-muted-foreground mb-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Local Storage Mode</span>
                </div>
                <div className="text-sm">Your data is currently stored locally in your browser</div>
                <div className="text-xs mt-2 opacity-75">
                  Sign in with Google to sync your portfolios across devices
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center gap-2 bg-white text-black hover:bg-gray-100 border border-gray-300"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {loading ? "Signing in..." : t.loginWithGoogle}
              </Button>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <div className="font-medium mb-1">Benefits of signing in:</div>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Sync portfolios across all your devices</li>
                    <li>Secure cloud backup of your data</li>
                    <li>Access from anywhere</li>
                    <li>Never lose your portfolio data</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/30">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-border/30">
                  {user?.avatar ? (
                    <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Cloud className="h-4 w-4" />
                  <span className="font-medium">Cloud Sync Enabled</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Your portfolios and alerts are automatically synced across all devices
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full flex items-center gap-2 border-border/50 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                {t.logout}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
