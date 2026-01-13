import { createClient } from 'redis'

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
    const client = await getRedisClient()
    const stateJson = await client.get(STATE_KEY)
    
    if (stateJson) {
      return JSON.parse(stateJson) as StoryState
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
    const client = await getRedisClient()
    await client.set(STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving story state to Redis:', error)
    throw error
  }
}

// Load all story entries from Redis
export async function loadStoryEntries(): Promise<StoryEntry[]> {
  try {
    const client = await getRedisClient()
    const entriesJson = await client.get(ENTRIES_KEY)
    
    if (entriesJson) {
      return JSON.parse(entriesJson) as StoryEntry[]
    }
    
    return []
  } catch (error) {
    console.error('Error loading story entries from Redis:', error)
    return []
  }
}

// Save story entry to Redis
export async function saveStoryEntry(entry: StoryEntry): Promise<void> {
  try {
    const client = await getRedisClient()
    const entries = await loadStoryEntries()
    entries.push(entry)
    await client.set(ENTRIES_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Error saving story entry to Redis:', error)
    throw error
  }
}

// Update existing story entry in Redis
export async function updateStoryEntry(day: number, updatedEntry: Partial<StoryEntry>): Promise<void> {
  try {
    const client = await getRedisClient()
    const entries = await loadStoryEntries()
    const index = entries.findIndex(e => e.day === day)
    
    if (index === -1) {
      throw new Error(`Entry for day ${day} not found`)
    }
    
    entries[index] = { ...entries[index], ...updatedEntry }
    await client.set(ENTRIES_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Error updating story entry in Redis:', error)
    throw error
  }
}

// Get entry by day from Redis
export async function getStoryEntryByDay(day: number): Promise<StoryEntry | null> {
  try {
    const client = await getRedisClient()
    const entries = await loadStoryEntries()
    return entries.find(e => e.day === day) || null
  } catch (error) {
    console.error('Error getting story entry from Redis:', error)
    return null
  }
}
