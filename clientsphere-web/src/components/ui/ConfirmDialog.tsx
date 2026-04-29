// src/components/ui/ConfirmDialog.tsx
import Modal from './Modal'

interface ConfirmDialogProps {
  open:        boolean
  onClose:     () => void
  onConfirm:   () => void
  title:       string
  description: string
  confirmLabel?:string
  loading?:    boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="
              px-4 h-9 rounded-lg text-sm font-medium
              border border-gray-200 text-gray-700
              hover:bg-gray-50 disabled:opacity-50 transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="
              px-4 h-9 rounded-lg text-sm font-medium
              bg-red-600 text-white
              hover:bg-red-700 disabled:opacity-60 transition-colors
              flex items-center gap-2
            "
          >
            {loading && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </Modal>
  )
}