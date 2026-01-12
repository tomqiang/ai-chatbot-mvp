'use client'

import { useState, useRef, useEffect } from 'react'
import StoryHeader from './components/StoryHeader'
import StoryComposer from './components/StoryComposer'
import StoryEntry from './components/StoryEntry'
import StorySnapshot from './components/StorySnapshot'
import EmptyState from './components/EmptyState'
import RewriteModal from './components/RewriteModal'

interface StoryEntryData {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  revision?: number
  updatedAt?: string
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
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
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
        revision: 1,
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

  const handleRewriteClick = () => {
    setIsRewriteModalOpen(true)
  }

  const handleRewrite = async (newEvent: string) => {
    setIsRewriting(true)
    setError(null)

    try {
      const response = await fetch('/api/rewrite-latest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEvent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rewrite story')
      }

      const data = await response.json()
      
      // Update snapshot state
      if (data.summary !== undefined) {
        setSnapshotState({
          day: data.day,
          summary: data.summary,
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
      }
      
      // Update the latest entry in the list
      setEntries((prev) => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            userEvent: newEvent,
            storyText: data.storyText,
            title: data.title,
            suggestions: data.suggestions,
            revision: data.revision,
            updatedAt: data.updatedAt,
          }
        }
        return updated
      })
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : '重写失败，请稍后再试。')
      throw error
    } finally {
      setIsRewriting(false)
    }
  }

  const currentDay = entries.length > 0 ? entries[entries.length - 1].day : 0
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null

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
                onRewrite={handleRewriteClick}
                isLatest={index === entries.length - 1}
              />
            ))}
            <div ref={entriesEndRef} />
          </div>
        </div>
      </main>

      {/* Rewrite Modal */}
      {latestEntry && (
        <RewriteModal
          isOpen={isRewriteModalOpen}
          currentEvent={latestEntry.userEvent}
          onClose={() => setIsRewriteModalOpen(false)}
          onRewrite={handleRewrite}
          isRewriting={isRewriting}
        />
      )}
    </div>
  )
}
