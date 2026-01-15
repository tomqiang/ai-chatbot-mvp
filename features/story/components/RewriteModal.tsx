'use client'

import { useState, useEffect, KeyboardEvent } from 'react'

interface RewriteModalProps {
  isOpen: boolean
  currentEvent: string
  onClose: () => void
  onRewrite: (newEvent: string) => Promise<void>
  isRewriting?: boolean
}

export default function RewriteModal({ 
  isOpen, 
  currentEvent, 
  onClose, 
  onRewrite,
  isRewriting = false 
}: RewriteModalProps) {
  const [input, setInput] = useState(currentEvent)
  const [error, setError] = useState<string | null>(null)
  const maxLength = 200

  useEffect(() => {
    if (isOpen) {
      setInput(currentEvent)
      setError(null)
    }
  }, [isOpen, currentEvent])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('事件不能为空')
      return
    }

    if (input.length > maxLength) {
      setError(`事件过长（最多${maxLength}字符）`)
      return
    }

    setError(null)
    try {
      await onRewrite(input.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重写失败，请稍后再试。')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">重写本章</h3>
          <button 
            onClick={onClose} 
            className="modal-close"
            disabled={isRewriting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <label htmlFor="rewrite-input" className="modal-label">
            编辑本章事件：
          </label>
          <textarea
            id="rewrite-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="例如：一二在森林中发现了一处古老的遗迹..."
            disabled={isRewriting}
            rows={3}
            className="modal-textarea"
            maxLength={maxLength}
          />
          <div className="modal-footer">
            <span className={`char-counter ${input.length > maxLength ? 'over-limit' : ''}`}>
              {maxLength - input.length} / {maxLength}
            </span>
            {error && (
              <span className="modal-error">{error}</span>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={onClose}
            disabled={isRewriting}
            className="modal-button cancel-button"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRewriting || !input.trim() || input.length > maxLength}
            className="modal-button rewrite-button"
          >
            {isRewriting ? '重写中...' : '重写'}
          </button>
        </div>
      </div>
    </div>
  )
}
