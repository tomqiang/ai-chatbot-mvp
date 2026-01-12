'use client'

import { useState, useRef, useEffect } from 'react'
import StoryEntry from './components/ChatMessage'
import StoryInput from './components/ChatInput'

interface StoryEntryData {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
}

export default function Home() {
  const [entries, setEntries] = useState<StoryEntryData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const entriesEndRef = useRef<HTMLDivElement>(null)

  // Load existing story entries on mount
  useEffect(() => {
    loadStory()
  }, [])

  const scrollToBottom = () => {
    entriesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [entries])

  const loadStory = async () => {
    try {
      const response = await fetch('/api/chat')
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error loading story:', error)
    }
  }

  const handleSendEvent = async (userEvent: string, allowFinal: boolean) => {
    if (!userEvent.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userEvent,
          allowFinal,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate story')
      }

      const data = await response.json()
      
      // Add new entry to the list
      const newEntry: StoryEntryData = {
        day: data.day,
        userEvent,
        storyText: data.storyText,
        createdAt: new Date().toISOString(),
      }
      setEntries((prev) => [...prev, newEntry])
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : '生成故事时出错，请重试。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="chat-container">
      <div className="chat-header">
        <h1>寻找「月影宝石」</h1>
        <p className="story-subtitle">每日故事生成器</p>
      </div>
      <div className="chat-messages">
        {entries.length === 0 && !isLoading && (
          <div className="story-empty">
            <p>故事尚未开始。输入今日事件，开始你的奇幻之旅。</p>
          </div>
        )}
        {entries.map((entry, index) => (
          <StoryEntry key={index} entry={entry} />
        ))}
        {isLoading && (
          <div className="story-entry">
            <div className="story-day">生成中...</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="story-error">
            <p>❌ {error}</p>
          </div>
        )}
        <div ref={entriesEndRef} />
      </div>
      <StoryInput onSend={handleSendEvent} disabled={isLoading} />
    </main>
  )
}
