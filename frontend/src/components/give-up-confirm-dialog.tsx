"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GiveUpConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function GiveUpConfirmDialog({ open, onConfirm, onCancel }: GiveUpConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Give Up?</DialogTitle>
        </DialogHeader>

        <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
          <Button variant="outline" onClick={onCancel}>
            No
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
