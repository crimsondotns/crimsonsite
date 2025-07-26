"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

export function DeleteConfirmModal({ open, onClose, onConfirm, title, description }: DeleteConfirmModalProps) {
  const { t } = useLanguage()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/50 animate-fade-in max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{description}</p>
          </div>

          <div className="text-sm text-muted-foreground">This action cannot be undone.</div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border/50">
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirm} className="flex-1">
              {t.delete}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
