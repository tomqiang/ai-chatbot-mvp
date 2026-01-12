'use client'

import { useState, useRef, useEffect } from 'react'
import StoryHeader from './components/StoryHeader'
import StoryComposer from './components/StoryComposer'
import StoryEntry from './components/StoryEntry'
import StorySnapshot from './components/StorySnapshot'
import EmptyState from './components/EmptyState'

interface StoryEntryData {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  title?: string // Optional for backward compatibility
  suggestions?: string[] // Optional: suggestions for tomorrow
}

interface StoryState {
  day: number
  summary: string
  updatedAt?: string
}

export default function Home() {
  const [entries, setEntries] = useState<StoryEntryData[]>([])
  const [snapshotState, setSnapshotState] = useState<StoryState>({
    day: 0,
    summary: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composerValue, setComposerValue] = useState('')
  const entriesEndRef = useRef<HTMLDivElement>(null)

  // Load existing story entries and state on mount
  useEffect(() => {
    loadStory()
    loadState()
  }, [])

  const scrollToBottom = () => {
    entriesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (entries.length > 0) {
      scrollToBottom()
    }
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

  const loadState = async () => {
    try {
      const response = await fetch('/api/state')
      if (response.ok) {
        const data = await response.json()
        setSnapshotState({
          day: data.day || 0,
          summary: data.summary || '',
          updatedAt: data.updatedAt,
        })
      }
    } catch (error) {
      console.error('Error loading state:', error)
    }
  }

  const handleGenerate = async (userEvent: string, allowFinal: boolean) => {
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
      
      // Update snapshot state from POST response
      if (data.summary !== undefined) {
        setSnapshotState({
          day: data.day,
          summary: data.summary,
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
      }
      
      // Add new entry to the list
      const newEntry: StoryEntryData = {
        day: data.day,
        userEvent,
        storyText: data.storyText,
        title: data.title,
        suggestions: data.suggestions,
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

  const handleSuggestionSelect = (suggestion: string) => {
    setComposerValue(suggestion)
  }

  const currentDay = entries.length > 0 ? entries[entries.length - 1].day : 0

  return (
    <div className="chronicle-app">
      <StoryHeader currentDay={currentDay} />
      
      <main className="chronicle-main">
        <div className="chronicle-content">
          {/* Story Snapshot */}
          <StorySnapshot
            day={snapshotState.day}
            summary={snapshotState.summary}
            updatedAt={snapshotState.updatedAt}
          />
          
          {/* Composer at top */}
          <StoryComposer 
            onGenerate={handleGenerate} 
            disabled={isLoading}
            initialValue={composerValue}
            onValueChange={setComposerValue}
          />
          
          {/* Error display */}
          {error && (
            <div className="chronicle-error">
              <p>❌ {error}</p>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="chronicle-loading">
              <div className="writing-state">
                <span className="writing-icon">✍️</span>
                <span>Writing today's chapter...</span>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {entries.length === 0 && !isLoading && <EmptyState />}
          
          {/* Chronicle entries */}
          <div className="chronicle-feed">
            {entries.map((entry, index) => (
              <StoryEntry 
                key={index} 
                entry={entry} 
                onSuggestionSelect={handleSuggestionSelect}
                isLatest={index === entries.length - 1}
              />
            ))}
            <div ref={entriesEndRef} />
          </div>
        </div>
      </main>
    </div>
  )
}
