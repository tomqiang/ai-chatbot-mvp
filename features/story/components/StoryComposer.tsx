'use client'

import { useState, KeyboardEvent, useEffect, useRef } from 'react'
import { DEFAULT_WORLD_UI } from '@/features/story/lib/worlds'

interface StoryComposerProps {
  onGenerate: (message: string, allowFinal: boolean) => void
  disabled?: boolean
  initialValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
}

export default function StoryComposer({ onGenerate, disabled, initialValue = '', onValueChange, placeholder }: StoryComposerProps) {
  const [input, setInput] = useState(initialValue)
  const [allowFinal, setAllowFinal] = useState(false)
  const maxLength = 200
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update input when initialValue changes (for suggestion selection)
  useEffect(() => {
    if (initialValue && initialValue !== input) {
      setInput(initialValue)
      if (onValueChange) {
        onValueChange(initialValue)
      }
      // Focus and scroll to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(initialValue.length, initialValue.length)
          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [initialValue])

  const handleGenerate = () => {
    if (input.trim() && !disabled && input.length <= maxLength) {
      onGenerate(input, allowFinal)
      setInput('')
      setAllowFinal(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const remainingChars = maxLength - input.length
  const isOverLimit = input.length > maxLength

  return (
    <div className="composer-card">
      <label htmlFor="event-input" className="composer-label">
        本章事件（一句话描述）
      </label>
      <textarea
        id="event-input"
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          if (onValueChange) {
            onValueChange(e.target.value)
          }
        }}
        onKeyDown={handleKeyPress}
        placeholder={placeholder || DEFAULT_WORLD_UI.todaysEventPlaceholder}
        disabled={disabled}
        rows={3}
        className="composer-textarea"
        maxLength={maxLength}
      />
      <div className="composer-footer">
        <div className="composer-meta">
          <span className={`char-counter ${isOverLimit ? 'over-limit' : ''}`}>
            {remainingChars} / {maxLength}
          </span>
          <label className="final-chapter-checkbox">
            <input
              type="checkbox"
              checked={allowFinal}
              onChange={(e) => setAllowFinal(e.target.checked)}
              disabled={disabled}
            />
            <span>允许终章</span>
          </label>
        </div>
        <button
          onClick={handleGenerate}
          disabled={disabled || !input.trim() || isOverLimit}
          className="generate-button"
        >
          {disabled ? (
            <>
              <span className="writing-indicator">✍️</span> 写作中...
            </>
          ) : (
            '生成下一章'
          )}
        </button>
      </div>
    </div>
  )
}
