'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StoryHeader from '@/app/components/StoryHeader'
import StoryComposer from '@/app/components/StoryComposer'
import StoryEntry from '@/app/components/StoryEntry'
import StorySnapshot from '@/app/components/StorySnapshot'
import EmptyState from '@/app/components/EmptyState'
import RewriteModal from '@/app/components/RewriteModal'
import SettingsDrawer from '@/app/components/SettingsDrawer'

interface StoryEntryData {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  revision?: number
  updatedAt?: string
  title?: string
  anchors?: {
    a: string
    b: string
    c: string
  }
  suggestions?: string[]
}

interface StoryState {
  day: number
  summary: string
  updatedAt?: string
}

export default function StoryPage() {
  const params = useParams()
  const router = useRouter()
  const storyId = params.storyId as string

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [storyExists, setStoryExists] = useState<boolean | null>(null)
  const entriesEndRef = useRef<HTMLDivElement>(null)

  // Debug utility: detect standalone mode (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (navigator as any).standalone === true
      const isStandaloneMode = isStandalone || isIOSStandalone
      
      console.log('[PWA Debug] Standalone mode:', {
        isStandalone,
        isIOSStandalone,
        isStandaloneMode,
        userAgent: navigator.userAgent,
      })
    }
  }, [])

  // Check if story exists and load data
  useEffect(() => {
    if (storyId) {
      checkStoryExists()
      loadStory()
      loadState()
    }
  }, [storyId])

  const checkStoryExists = async () => {
    try {
      const response = await fetch(`/api/story/${storyId}/meta`)
      if (response.ok) {
        setStoryExists(true)
      } else {
        setStoryExists(false)
        // Redirect to / with error after a brief delay
        setTimeout(() => {
          router.push('/?error=Story not found')
        }, 2000)
      }
    } catch (error) {
      setStoryExists(false)
      router.push('/?error=Failed to load story')
    }
  }

  const handleDataCleared = () => {
    // Reset all state
    setEntries([])
    setSnapshotState({
      day: 0,
      summary: '',
    })
    setComposerValue('')
    setError(null)
    
    // Reload page to ensure clean state
    window.location.reload()
  }

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
      const response = await fetch(`/api/story/${storyId}/entries`)
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
      const response = await fetch(`/api/story/${storyId}/state`)
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
      const response = await fetch(`/api/story/${storyId}/chat`, {
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
      const response = await fetch(`/api/story/${storyId}/rewrite-latest`, {
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

  // Show loading or error state
  if (storyExists === false) {
    return (
      <div className="chronicle-app">
        <main className="chronicle-main">
          <div className="chronicle-content">
            <div className="chronicle-error">
              <p>Story not found. Redirecting to Story Library...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (storyExists === null) {
    return (
      <div className="chronicle-app">
        <main className="chronicle-main">
          <div className="chronicle-content">
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              Loading story...
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="chronicle-app">
      <StoryHeader 
        currentDay={currentDay} 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onBackToLibrary={() => router.push('/')}
      />
      
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

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataCleared={handleDataCleared}
      />
    </div>
  )
}
