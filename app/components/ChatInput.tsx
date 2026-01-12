'use client'

import { useState, KeyboardEvent } from 'react'

interface StoryInputProps {
  onSend: (message: string, allowFinal: boolean) => void
  disabled?: boolean
}

export default function StoryInput({ onSend, disabled }: StoryInputProps) {
  const [input, setInput] = useState('')
  const [allowFinal, setAllowFinal] = useState(false)

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input, allowFinal)
      setInput('')
      setAllowFinal(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-container">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="今日事件（一句话即可）"
        disabled={disabled}
        rows={1}
        className="chat-input"
      />
      <div className="input-actions">
        <label className="final-chapter-checkbox">
          <input
            type="checkbox"
            checked={allowFinal}
            onChange={(e) => setAllowFinal(e.target.checked)}
            disabled={disabled}
          />
          <span>最终章节</span>
        </label>
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="send-button"
        >
          继续故事
        </button>
      </div>
    </div>
  )
}
