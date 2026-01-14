'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WORLDS, type World } from '@/app/lib/worlds'
import { startNewStory, continueStory } from '@/app/actions/storyActions'
import type { StoryMeta } from '@/app/lib/storyState'

// Get vibe tags for a world
function getWorldVibeTags(worldId: string): string[] {
  const tagMap: Record<string, string[]> = {
    middle_earth: ['史诗旅途', '高奇幻'],
    wizard_school: ['学院秘闻', '规则与禁区'],
    future_city: ['系统与权限', '异常信号'],
  }
  return tagMap[worldId] || []
}

// Get preview from initialSummary (first sentence)
function getWorldPreview(initialSummary: string): string {
  const firstSentence = initialSummary.split(/[。！？]/)[0] || initialSummary
  return firstSentence.trim()
}

function CreateStoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedWorldId, setSelectedWorldId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [pastStories, setPastStories] = useState<StoryMeta[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isContinuing, setIsContinuing] = useState<string | null>(null)

  useEffect(() => {
    // Check for error in query params
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
    }
    loadPastStories()
  }, [searchParams])

  const loadPastStories = async () => {
    try {
      const response = await fetch('/api/stories')
      if (response.ok) {
        const data = await response.json()
        setPastStories(data.stories || [])
      }
    } catch (error) {
      console.error('Error loading past stories:', error)
    } finally {
      setIsLoadingStories(false)
    }
  }

  const handleStartNewStory = async () => {
    if (!selectedWorldId) {
      setError('Please select a world')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await startNewStory(selectedWorldId)
      if (result.error) {
        setError(result.error)
      } else if (result.storyId) {
        router.push(`/story/${result.storyId}`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create story')
    } finally {
      setIsCreating(false)
    }
  }

  const handleContinueStory = async (storyId: string) => {
    setIsContinuing(storyId)
    setError(null)

    try {
      const result = await continueStory(storyId)
      if (result.error) {
        setError(result.error)
      } else if (result.storyId) {
        router.push(`/story/${result.storyId}`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to continue story')
    } finally {
      setIsContinuing(null)
    }
  }

  const handleViewStory = (storyId: string) => {
    router.push(`/story/${storyId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="chronicle-app">
      <header className="story-header">
        <div className="header-content">
          <div className="header-main">
            <h1 className="chronicle-title">Moonshadow Chronicle</h1>
            <p className="quest-subtitle">Story Library</p>
          </div>
        </div>
      </header>

      <main className="chronicle-main">
        <div className="chronicle-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {error && (
            <div className="chronicle-error" style={{ marginBottom: '24px' }}>
              <p>❌ {error}</p>
            </div>
          )}

          {/* Section A: Create Story */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2c3e50', marginBottom: '24px' }}>
              Create New Story
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {WORLDS.map((world) => {
                const vibeTags = getWorldVibeTags(world.id)
                const preview = getWorldPreview(world.initialSummary)
                return (
                  <label
                    key={world.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '20px',
                      border: `2px solid ${selectedWorldId === world.id ? '#667eea' : '#e8e6e3'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedWorldId === world.id ? '#f0f7ff' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="world"
                      value={world.id}
                      checked={selectedWorldId === world.id}
                      onChange={(e) => setSelectedWorldId(e.target.value)}
                      style={{ marginTop: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                          {world.displayName}
                        </h3>
                        {vibeTags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {vibeTags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: '#667eea',
                                  background: '#f0f7ff',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  border: '1px solid #e0e7ff',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '6px', lineHeight: 1.6 }}>
                        {world.description}
                      </p>
                      <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                        {preview}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
            <button
              onClick={handleStartNewStory}
              disabled={!selectedWorldId || isCreating}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: selectedWorldId && !isCreating ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: selectedWorldId && !isCreating ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {isCreating ? 'Creating...' : 'Start New Story'}
            </button>
          </section>

          {/* Section B: Past Stories */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2c3e50', marginBottom: '24px' }}>
              Past Stories
            </h2>
            {isLoadingStories ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                Loading stories...
              </div>
            ) : pastStories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                No past stories yet. Create your first story above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pastStories.map((story) => {
                  const world = WORLDS.find(w => w.id === story.worldId) || WORLDS[0]
                  return (
                    <div
                      key={story.storyId}
                      style={{
                        padding: '20px',
                        border: '1px solid #e8e6e3',
                        borderRadius: '12px',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>
                            {story.title || world.displayName}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                            {world.displayName} · Day {story.lastDay} · {formatDate(story.createdAt)}
                          </p>
                          {story.lastSummary && (
                            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginTop: '8px' }}>
                              {story.lastSummary.slice(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button
                          onClick={() => handleViewStory(story.storyId)}
                          style={{
                            padding: '8px 16px',
                            background: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleContinueStory(story.storyId)}
                          disabled={isContinuing === story.storyId}
                          style={{
                            padding: '8px 16px',
                            background: isContinuing === story.storyId ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: 'white',
                            cursor: isContinuing === story.storyId ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isContinuing === story.storyId ? 'Loading...' : 'Continue'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="chronicle-app">
        <main className="chronicle-main">
          <div className="chronicle-content" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Loading...
          </div>
        </main>
      </div>
    }>
      <CreateStoryContent />
    </Suspense>
  )
}
