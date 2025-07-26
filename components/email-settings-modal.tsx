"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Mail, Check, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { useEmailNotifications } from "@/hooks/use-email-notifications"

interface EmailSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function EmailSettingsModal({ open, onClose }: EmailSettingsModalProps) {
  const [newEmail, setNewEmail] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationSent, setVerificationSent] = useState("")
  const [error, setError] = useState("")

  const {
    emailSettings,
    updateEmailSettings,
    validateEmail,
    sendVerificationEmail,
    addEmailAddress,
    removeEmailAddress,
  } = useEmailNotifications()

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setNewEmail(email)
    setError("")
    setVerificationSent("")
  }

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      setError("Please enter an email address")
      return
    }

    if (!validateEmail(newEmail)) {
      setError("Please enter a valid email address")
      return
    }

    if (emailSettings.emailAddresses?.length >= 50) {
      setError("Maximum 50 email addresses allowed")
      return
    }

    if (emailSettings.emailAddresses?.some((e) => e.address === newEmail)) {
      setError("Email address already added")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const success = await sendVerificationEmail(newEmail)
      if (success) {
        await addEmailAddress(newEmail)
        setVerificationSent(newEmail)
        setNewEmail("")
        setError("")
      } else {
        setError("Failed to send verification email. Please try again.")
      }
    } catch (error) {
      setError("An error occurred while adding email address")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRemoveEmail = async (emailAddress: string) => {
    await removeEmailAddress(emailAddress)
  }

  const handleToggleEnabled = (enabled: boolean) => {
    if (enabled && emailSettings.emailAddresses?.filter((e) => e.verified).length === 0) {
      setError("Please verify at least one email address first")
      return
    }
    updateEmailSettings({ enabled })
  }

  const handleClose = () => {
    setNewEmail("")
    setError("")
    setVerificationSent("")
    onClose()
  }

  const verifiedCount = emailSettings.emailAddresses?.filter((e) => e.verified).length || 0
  const totalCount = emailSettings.emailAddresses?.length || 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-2xl max-h-[90vh] p-0">
        <div className="modal-scrollable hidden-scrollbar p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5" />
              Email Notifications
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/30">
              <div>
                <Label htmlFor="emailEnabled" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <div className="text-xs text-muted-foreground">
                  Receive price alerts via email ({verifiedCount} verified of {totalCount} addresses)
                </div>
              </div>
              <Switch
                id="emailEnabled"
                checked={emailSettings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={verifiedCount === 0}
              />
            </div>

            {/* Add New Email */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Add Email Address ({totalCount}/50)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={handleEmailChange}
                    placeholder="your.email@example.com"
                    className="bg-background/50 backdrop-blur-sm border-border/50"
                    disabled={totalCount >= 50}
                  />
                  <Button
                    type="button"
                    onClick={handleAddEmail}
                    disabled={isVerifying || !newEmail.trim() || totalCount >= 50}
                    className="whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {verificationSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                  <Check className="h-4 w-4" />
                  Verification email sent to {verificationSent}! (For demo purposes, email is automatically verified)
                </div>
              )}
            </div>

            {/* Email List */}
            {emailSettings.emailAddresses && emailSettings.emailAddresses.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Email Addresses</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {emailSettings.emailAddresses.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-sm truncate">{email.address}</div>
                          <div className="text-xs text-muted-foreground">
                            Added {new Date(email.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={email.verified ? "default" : "secondary"}>
                          {email.verified ? (
                            <div className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Verified
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Unverified
                            </div>
                          )}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(email.address)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <div className="font-medium mb-1">Multi-Email Alert System:</div>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Add up to 50 email addresses for notifications</li>
                  <li>All verified emails receive alerts simultaneously</li>
                  <li>Each email must be verified before receiving alerts</li>
                  <li>Emails are sent instantly when price alerts trigger</li>
                  <li>You can enable/disable email alerts independently</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
