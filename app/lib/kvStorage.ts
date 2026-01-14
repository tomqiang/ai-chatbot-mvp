import { createClient } from 'redis'

// Legacy keys (for migration)
const LEGACY_STATE_KEY = 'story:state'
const LEGACY_ENTRIES_KEY = 'story:entries'

// New multi-story keys
const ACTIVE_STORY_KEY = 'app:activeStoryId'
const STORIES_INDEX_KEY = 'stories:index'

// Key builders for storyId-based keys
function storyMetaKey(storyId: string): string {
  return `story:meta:${storyId}`
}

function storyStateKey(storyId: string): string {
  return `story:state:${storyId}`
}

function storyIndexKey(storyId: string): string {
  return `story:index:${storyId}`
}

function storyEntryKey(storyId: string, day: number): string {
  return `story:entry:${storyId}:${day}`
}

// Story metadata structure
export interface StoryMeta {
  storyId: string
  worldId: string
  worldVersion?: string
  createdAt: string
  updatedAt: string
  title?: string
  lastDay: number
  lastSummary?: string
}

// Story state structure (per story)
export interface StoryState {
  day: number
  summary: string
  worldId?: string
  worldVersion?: string
}

export interface StoryEntry {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  revision?: number
  updatedAt?: string
  title?: string
  anchors?: {
    a: string // specific place/object
    b: string // unresolved clue/foreshadowing
    c: string // character state/constraint
  }
  suggestions?: string[]
  event_keywords?: string[] // Keywords extracted from userEvent for title anchoring
}

// Redis client singleton for serverless (reused across invocations in the same container)
let redisClient: ReturnType<typeof createClient> | null = null
let isConnecting = false

async function getRedisClient() {
  // In serverless, we reuse the connection if it exists and is connected
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting && redisClient) {
    // Wait for the connection to complete
    while (!redisClient.isOpen && isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (redisClient.isOpen) {
      return redisClient
    }
  }

  // Vercel Redis Marketplace sets REDIS_URL automatically
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error(
      'Redis is not configured. Please set REDIS_URL environment variable.\n' +
      'If you installed Redis from Vercel Marketplace, the REDIS_URL should be automatically set.\n' +
      'Check your Vercel project settings → Environment Variables to verify REDIS_URL is present.'
    )
  }

  isConnecting = true

  try {
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        // Serverless-friendly settings
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return new Error('Too many reconnection attempts')
          }
          return Math.min(retries * 100, 1000)
        },
      },
    })
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err)
    })

    await redisClient.connect()
    isConnecting = false
    return redisClient
  } catch (error) {
    isConnecting = false
    redisClient = null
    throw error
  }
}

// Simple lock implementation using Redis SET with NX and EX
async function acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
  try {
    const client = await getRedisClient()
    const result = await client.set(lockKey, '1', { NX: true, EX: ttlSeconds })
    return result === 'OK'
  } catch (error) {
    console.error(`Error acquiring lock ${lockKey}:`, error)
    return false
  }
}

async function releaseLock(lockKey: string): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.del(lockKey)
  } catch (error) {
    console.error(`Error releasing lock ${lockKey}:`, error)
  }
}

// Migration: Migrate legacy single-story data to storyId-based structure
async function migrateLegacyData(): Promise<string | null> {
  try {
    const client = await getRedisClient()
    
    // Check if legacy state exists
    const legacyState = await client.get(LEGACY_STATE_KEY)
    if (!legacyState) {
      return null // No legacy data to migrate
    }

    // Check if migration already done (s_legacy exists)
    const legacyStoryId = 's_legacy'
    const legacyMeta = await client.hGetAll(storyMetaKey(legacyStoryId))
    if (legacyMeta && Object.keys(legacyMeta).length > 0) {
      return legacyStoryId // Already migrated
    }

    console.log('[Migration] Migrating legacy single-story data to storyId-based structure...')

    // Parse legacy state
    const state = JSON.parse(legacyState) as { day: number; summary: string }
    
    // Load legacy entries
    const legacyEntriesJson = await client.get(LEGACY_ENTRIES_KEY)
    const legacyEntries: StoryEntry[] = legacyEntriesJson ? JSON.parse(legacyEntriesJson) : []

    // Create story metadata
    const now = new Date().toISOString()
    const meta: StoryMeta = {
      storyId: legacyStoryId,
      worldId: 'middle_earth', // Default to middle_earth
      createdAt: now,
      updatedAt: now,
      lastDay: state.day,
      lastSummary: state.summary,
    }

    // Save story metadata
    await client.hSet(storyMetaKey(legacyStoryId), {
      storyId: meta.storyId,
      worldId: meta.worldId,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      lastDay: String(meta.lastDay),
      lastSummary: meta.lastSummary || '',
    })

    // Save story state
    await client.hSet(storyStateKey(legacyStoryId), {
      day: String(state.day),
      summary: state.summary,
      worldId: meta.worldId,
    })

    // Migrate entries
    for (const entry of legacyEntries) {
      // Save entry as hash
      await client.hSet(storyEntryKey(legacyStoryId, entry.day), {
        day: String(entry.day),
        userEvent: entry.userEvent,
        storyText: entry.storyText,
        createdAt: entry.createdAt,
        revision: String(entry.revision || 1),
        updatedAt: entry.updatedAt || entry.createdAt,
        title: entry.title || '',
        anchors: JSON.stringify(entry.anchors || {}),
        suggestions: JSON.stringify(entry.suggestions || []),
        event_keywords: JSON.stringify(entry.event_keywords || []),
      })

      // Add to story index
      await client.zAdd(storyIndexKey(legacyStoryId), {
        score: entry.day,
        value: String(entry.day),
      })
    }

    // Add to stories index
    await client.zAdd(STORIES_INDEX_KEY, {
      score: Date.now(),
      value: legacyStoryId,
    })

    // Set as active story
    await client.set(ACTIVE_STORY_KEY, legacyStoryId)

    // Delete legacy keys
    await client.del(LEGACY_STATE_KEY)
    await client.del(LEGACY_ENTRIES_KEY)

    console.log('[Migration] Legacy data migrated successfully to', legacyStoryId)
    return legacyStoryId
  } catch (error) {
    console.error('[Migration] Error migrating legacy data:', error)
    return null
  }
}

// Get active story ID (with migration check)
export async function getActiveStoryId(): Promise<string | null> {
  try {
    const client = await getRedisClient()
    let activeId = await client.get(ACTIVE_STORY_KEY)

    // If no active story, check for legacy data and migrate
    if (!activeId) {
      const migratedId = await migrateLegacyData()
      if (migratedId) {
        return migratedId
      }
      return null
    }

    return activeId
  } catch (error) {
    console.error('Error getting active story ID:', error)
    return null
  }
}

// Set active story ID
export async function setActiveStoryId(storyId: string): Promise<void> {
  try {
    const client = await getRedisClient()
    // Validate story exists
    const meta = await client.hGetAll(storyMetaKey(storyId))
    if (!meta || Object.keys(meta).length === 0) {
      throw new Error(`Story ${storyId} does not exist`)
    }
    await client.set(ACTIVE_STORY_KEY, storyId)
  } catch (error) {
    console.error('Error setting active story ID:', error)
    throw error
  }
}

// List all stories (from stories index)
export async function listStories(): Promise<StoryMeta[]> {
  try {
    const client = await getRedisClient()
    const storyIds = await client.zRange(STORIES_INDEX_KEY, 0, -1, { REV: true }) // Latest first

    const stories: StoryMeta[] = []
    for (const storyId of storyIds) {
      const metaData = await client.hGetAll(storyMetaKey(storyId))
      if (metaData && Object.keys(metaData).length > 0) {
        stories.push({
          storyId: metaData.storyId || storyId,
          worldId: metaData.worldId || 'middle_earth',
          worldVersion: metaData.worldVersion,
          createdAt: metaData.createdAt || new Date().toISOString(),
          updatedAt: metaData.updatedAt || new Date().toISOString(),
          title: metaData.title,
          lastDay: parseInt(metaData.lastDay || '0', 10),
          lastSummary: metaData.lastSummary,
        })
      }
    }

    return stories
  } catch (error) {
    console.error('Error listing stories:', error)
    return []
  }
}

// Get story metadata
export async function getStoryMeta(storyId: string): Promise<StoryMeta | null> {
  try {
    const client = await getRedisClient()
    const metaData = await client.hGetAll(storyMetaKey(storyId))
    
    if (!metaData || Object.keys(metaData).length === 0) {
      return null
    }

    return {
      storyId: metaData.storyId || storyId,
      worldId: metaData.worldId || 'middle_earth',
      worldVersion: metaData.worldVersion,
      createdAt: metaData.createdAt || new Date().toISOString(),
      updatedAt: metaData.updatedAt || new Date().toISOString(),
      title: metaData.title,
      lastDay: parseInt(metaData.lastDay || '0', 10),
      lastSummary: metaData.lastSummary,
    }
  } catch (error) {
    console.error('Error getting story meta:', error)
    return null
  }
}

// Create new story
export async function createStory(
  storyId: string,
  worldId: string,
  initialSummary: string
): Promise<void> {
  const lockKey = 'lock:story:create'
  const acquired = await acquireLock(lockKey, 30)
  
  if (!acquired) {
    throw new Error('Could not acquire lock for story creation')
  }

  try {
    const client = await getRedisClient()
    const now = new Date().toISOString()

    // Create story metadata
    const meta: StoryMeta = {
      storyId,
      worldId,
      createdAt: now,
      updatedAt: now,
      lastDay: 0,
      lastSummary: initialSummary,
    }

    await client.hSet(storyMetaKey(storyId), {
      storyId: meta.storyId,
      worldId: meta.worldId,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      lastDay: '0',
      lastSummary: initialSummary,
    })

    // Create story state
    await client.hSet(storyStateKey(storyId), {
      day: '0',
      summary: initialSummary,
      worldId: worldId,
    })

    // Add to stories index
    await client.zAdd(STORIES_INDEX_KEY, {
      score: Date.now(),
      value: storyId,
    })

    // Set as active
    await client.set(ACTIVE_STORY_KEY, storyId)
  } finally {
    await releaseLock(lockKey)
  }
}

// Load story state for a specific storyId
export async function loadStoryState(storyId: string): Promise<StoryState> {
  try {
    const client = await getRedisClient()
    const stateData = await client.hGetAll(storyStateKey(storyId))
    
    if (stateData && Object.keys(stateData).length > 0) {
      return {
        day: parseInt(stateData.day || '0', 10),
        summary: stateData.summary || '',
        worldId: stateData.worldId,
        worldVersion: stateData.worldVersion,
      }
    }

    // If story doesn't exist, throw error
    throw new Error(`Story ${storyId} not found`)
  } catch (error) {
    console.error(`Error loading story state for ${storyId}:`, error)
    throw error
  }
}

// Save story state for a specific storyId
export async function saveStoryState(storyId: string, state: StoryState): Promise<void> {
  try {
    const client = await getRedisClient()
    const now = new Date().toISOString()

    await client.hSet(storyStateKey(storyId), {
      day: String(state.day),
      summary: state.summary,
      worldId: state.worldId || '',
      worldVersion: state.worldVersion || '',
    })

    // Update story metadata
    await client.hSet(storyMetaKey(storyId), {
      updatedAt: now,
      lastDay: String(state.day),
      lastSummary: state.summary,
    })
  } catch (error) {
    console.error(`Error saving story state for ${storyId}:`, error)
    throw error
  }
}

// Load all story entries for a specific storyId
export async function loadStoryEntries(storyId: string): Promise<StoryEntry[]> {
  try {
    const client = await getRedisClient()
    const dayStrings = await client.zRange(storyIndexKey(storyId), 0, -1)
    
    const entries: StoryEntry[] = []
    for (const dayStr of dayStrings) {
      const day = parseInt(dayStr, 10)
      const entryData = await client.hGetAll(storyEntryKey(storyId, day))
      
      if (entryData && Object.keys(entryData).length > 0) {
        entries.push({
          day: parseInt(entryData.day || '0', 10),
          userEvent: entryData.userEvent || '',
          storyText: entryData.storyText || '',
          createdAt: entryData.createdAt || new Date().toISOString(),
          revision: parseInt(entryData.revision || '1', 10),
          updatedAt: entryData.updatedAt,
          title: entryData.title,
          anchors: entryData.anchors ? JSON.parse(entryData.anchors) : undefined,
          suggestions: entryData.suggestions ? JSON.parse(entryData.suggestions) : undefined,
          event_keywords: entryData.event_keywords ? JSON.parse(entryData.event_keywords) : undefined,
        })
      }
    }

    return entries.sort((a, b) => a.day - b.day)
  } catch (error) {
    console.error(`Error loading story entries for ${storyId}:`, error)
    return []
  }
}

// Save story entry for a specific storyId
export async function saveStoryEntry(storyId: string, entry: StoryEntry): Promise<void> {
  try {
    const client = await getRedisClient()
    
    await client.hSet(storyEntryKey(storyId, entry.day), {
      day: String(entry.day),
      userEvent: entry.userEvent,
      storyText: entry.storyText,
      createdAt: entry.createdAt,
      revision: String(entry.revision || 1),
      updatedAt: entry.updatedAt || entry.createdAt,
      title: entry.title || '',
      anchors: JSON.stringify(entry.anchors || {}),
      suggestions: JSON.stringify(entry.suggestions || []),
      event_keywords: JSON.stringify(entry.event_keywords || []),
    })

    // Add to story index
    await client.zAdd(storyIndexKey(storyId), {
      score: entry.day,
      value: String(entry.day),
    })
  } catch (error) {
    console.error(`Error saving story entry for ${storyId}:`, error)
    throw error
  }
}

// Update existing story entry for a specific storyId
export async function updateStoryEntry(
  storyId: string,
  day: number,
  updatedEntry: Partial<StoryEntry>
): Promise<void> {
  try {
    const client = await getRedisClient()
    const existingData = await client.hGetAll(storyEntryKey(storyId, day))
    
    if (!existingData || Object.keys(existingData).length === 0) {
      throw new Error(`Entry for day ${day} not found in story ${storyId}`)
    }

    const now = new Date().toISOString()
    const updated: Record<string, string> = {
      ...existingData,
      updatedAt: now,
    }

    if (updatedEntry.userEvent !== undefined) updated.userEvent = updatedEntry.userEvent
    if (updatedEntry.storyText !== undefined) updated.storyText = updatedEntry.storyText
    if (updatedEntry.title !== undefined) updated.title = updatedEntry.title || ''
    if (updatedEntry.anchors !== undefined) updated.anchors = JSON.stringify(updatedEntry.anchors || {})
    if (updatedEntry.suggestions !== undefined) updated.suggestions = JSON.stringify(updatedEntry.suggestions || [])
    if (updatedEntry.event_keywords !== undefined) updated.event_keywords = JSON.stringify(updatedEntry.event_keywords || [])
    if (updatedEntry.revision !== undefined) updated.revision = String(updatedEntry.revision)

    await client.hSet(storyEntryKey(storyId, day), updated)
  } catch (error) {
    console.error(`Error updating story entry for ${storyId}:`, error)
    throw error
  }
}

// Get entry by day for a specific storyId
export async function getStoryEntryByDay(storyId: string, day: number): Promise<StoryEntry | null> {
  try {
    const client = await getRedisClient()
    const entryData = await client.hGetAll(storyEntryKey(storyId, day))
    
    if (!entryData || Object.keys(entryData).length === 0) {
      return null
    }

    return {
      day: parseInt(entryData.day || '0', 10),
      userEvent: entryData.userEvent || '',
      storyText: entryData.storyText || '',
      createdAt: entryData.createdAt || new Date().toISOString(),
      revision: parseInt(entryData.revision || '1', 10),
      updatedAt: entryData.updatedAt,
      title: entryData.title,
      anchors: entryData.anchors ? JSON.parse(entryData.anchors) : undefined,
      suggestions: entryData.suggestions ? JSON.parse(entryData.suggestions) : undefined,
      event_keywords: entryData.event_keywords ? JSON.parse(entryData.event_keywords) : undefined,
    }
  } catch (error) {
    console.error(`Error getting story entry for ${storyId}:`, error)
    return null
  }
}
