import type { ReactNode } from 'react'
import { Modal, type ModalTone } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ModalTone
  icon?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'accent',
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  )
}
