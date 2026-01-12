import { Redis } from '@upstash/redis'

// Redis keys
const STATE_KEY = 'story:state'
const ENTRIES_KEY = 'story:entries'

// Story state structure
export interface StoryState {
  day: number
  summary: string
}

export interface StoryEntry {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  revision?: number
  updatedAt?: string
  title?: string
  suggestions?: string[]
}

// Initialize Redis client
let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error('Upstash Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }

    redis = new Redis({
      url,
      token,
    })
  }
  return redis
}

// Initialize default story state
function getDefaultState(): StoryState {
  return {
    day: 0,
    summary: '一二和布布是一对伴侣，他们踏上了寻找「月影宝石」的旅程。一二擅长魔法，性格沉静；布布勇敢坚强，擅长近战。他们相互扶持，在奇幻世界中前行。'
  }
}

// Load story state from Redis
export async function loadStoryState(): Promise<StoryState> {
  try {
    const client = getRedisClient()
    const state = await client.get<StoryState>(STATE_KEY)
    
    if (state) {
      return state
    }
    
    // Initialize with default state
    const defaultState = getDefaultState()
    await saveStoryState(defaultState)
    return defaultState
  } catch (error) {
    console.error('Error loading story state from Redis:', error)
    // Return default state on error
    return getDefaultState()
  }
}

// Save story state to Redis
export async function saveStoryState(state: StoryState): Promise<void> {
  try {
    const client = getRedisClient()
    await client.set(STATE_KEY, state)
  } catch (error) {
    console.error('Error saving story state to Redis:', error)
    throw error
  }
}

// Load all story entries from Redis
export async function loadStoryEntries(): Promise<StoryEntry[]> {
  try {
    const client = getRedisClient()
    const entries = await client.get<StoryEntry[]>(ENTRIES_KEY)
    return entries || []
  } catch (error) {
    console.error('Error loading story entries from Redis:', error)
    return []
  }
}

// Save story entry to Redis
export async function saveStoryEntry(entry: StoryEntry): Promise<void> {
  try {
    const client = getRedisClient()
    const entries = await loadStoryEntries()
    entries.push(entry)
    await client.set(ENTRIES_KEY, entries)
  } catch (error) {
    console.error('Error saving story entry to Redis:', error)
    throw error
  }
}

// Update existing story entry in Redis
export async function updateStoryEntry(day: number, updatedEntry: Partial<StoryEntry>): Promise<void> {
  try {
    const client = getRedisClient()
    const entries = await loadStoryEntries()
    const index = entries.findIndex(e => e.day === day)
    
    if (index === -1) {
      throw new Error(`Entry for day ${day} not found`)
    }
    
    entries[index] = { ...entries[index], ...updatedEntry }
    await client.set(ENTRIES_KEY, entries)
  } catch (error) {
    console.error('Error updating story entry in Redis:', error)
    throw error
  }
}

// Get entry by day from Redis
export async function getStoryEntryByDay(day: number): Promise<StoryEntry | null> {
  try {
    const client = getRedisClient()
    const entries = await loadStoryEntries()
    return entries.find(e => e.day === day) || null
  } catch (error) {
    console.error('Error getting story entry from Redis:', error)
    return null
  }
}
