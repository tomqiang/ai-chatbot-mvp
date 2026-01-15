'use client'

import { useState } from 'react'
import { clearAllDataAction } from '@/app/actions/clearAllData'

interface ClearAllDataModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ClearAllDataModal({ isOpen, onClose, onSuccess }: ClearAllDataModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE' || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await clearAllDataAction(confirmText)

      if (result.ok) {
        // Success - close modal and refresh
        setConfirmText('')
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to clear data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    setConfirmText('')
    setError(null)
    onClose()
  }

  const canConfirm = confirmText === 'DELETE' && !isLoading

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={handleClose} />
      
      {/* Modal */}
      <div className="clear-all-modal">
        <div className="clear-all-modal-header">
          <h2 className="clear-all-modal-title">⚠️ Clear All Data</h2>
          <button 
            className="clear-all-modal-close" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="clear-all-modal-content">
          <div className="clear-all-warning">
            <p className="clear-all-warning-text">
              This action will <strong>permanently delete</strong> all app data:
            </p>
            <ul className="clear-all-warning-list">
              <li>All story entries and chapters</li>
              <li>Story state and summary</li>
              <li>All LLM call logs</li>
              <li>All locks and temporary data</li>
            </ul>
            <p className="clear-all-warning-text">
              <strong>This cannot be undone.</strong>
            </p>
          </div>

          <div className="clear-all-confirm-section">
            <label htmlFor="confirm-input" className="clear-all-confirm-label">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="clear-all-confirm-input"
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) {
                  handleConfirm()
                }
              }}
            />
          </div>

          {error && (
            <div className="clear-all-error">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="clear-all-loading">
              Clearing all data...
            </div>
          )}
        </div>

        <div className="clear-all-modal-footer">
          <button
            className="clear-all-btn clear-all-btn-cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="clear-all-btn clear-all-btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isLoading ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>
      </div>
    </>
  )
}
