import { createClient } from 'redis'

// Redis client for admin operations
let redisClient: ReturnType<typeof createClient> | null = null
let isConnecting = false

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  if (isConnecting && redisClient) {
    while (!redisClient.isOpen && isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (redisClient.isOpen) {
      return redisClient
    }
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL not configured')
  }

  isConnecting = true
  try {
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) return new Error('Too many reconnection attempts')
          return Math.min(retries * 100, 1000)
        },
      },
    })
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis Admin Client Error:', err)
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

const LOCK_KEY = 'lock:danger:clear'
const LOCK_TTL = 30 // seconds

// Acquire lock
async function acquireLock(): Promise<boolean> {
  try {
    const client = await getRedisClient()
    // SET key value NX EX ttl - only set if not exists, with expiration
    const result = await client.set(LOCK_KEY, Date.now().toString(), {
      EX: LOCK_TTL,
      NX: true,
    })
    return result === 'OK'
  } catch (error) {
    console.error('Failed to acquire lock:', error)
    return false
  }
}

// Release lock
async function releaseLock(): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.del(LOCK_KEY)
  } catch (error) {
    console.error('Failed to release lock:', error)
  }
}

// Scan and delete keys matching pattern
async function scanAndDelete(pattern: string, batchSize = 200): Promise<number> {
  const client = await getRedisClient()
  let cursor = 0
  let deleted = 0

  do {
    // SCAN cursor MATCH pattern COUNT count
    const result = await client.scan(cursor, {
      MATCH: pattern,
      COUNT: batchSize,
    })
    
    cursor = result.cursor
    const keys = result.keys

    if (keys.length > 0) {
      // Use UNLINK if available (non-blocking), otherwise DEL
      try {
        await client.unlink(keys)
        deleted += keys.length
      } catch (error) {
        // Fallback to DEL if UNLINK not available
        await client.del(keys)
        deleted += keys.length
      }
    }
  } while (cursor !== 0)

  return deleted
}

// Clear all app data
export async function clearAllData(): Promise<{ ok: boolean; deleted: number; tookMs: number; error?: string }> {
  const startTime = Date.now()

  // Acquire lock
  const lockAcquired = await acquireLock()
  if (!lockAcquired) {
    return {
      ok: false,
      deleted: 0,
      tookMs: Date.now() - startTime,
      error: 'Another clear operation is in progress. Please try again in a moment.',
    }
  }

  try {
    const client = await getRedisClient()
    let totalDeleted = 0

    // Delete keys matching patterns using SCAN
    // Note: Using the actual key patterns from the codebase
    const patterns = [
      'llm:log:*',      // LLM log entries
      'lock:*',         // All locks
    ]

    for (const pattern of patterns) {
      const deleted = await scanAndDelete(pattern)
      totalDeleted += deleted
      console.log(`[Clear All] Deleted ${deleted} keys matching ${pattern}`)
    }

    // Delete fixed keys (exact matches)
    const fixedKeys = [
      'story:state',      // Story state HASH
      'story:entries',   // Story entries (stored as single HASH or array)
      'llm:logs:index',   // LLM logs index ZSET
    ]

    const existingFixedKeys: string[] = []
    for (const key of fixedKeys) {
      const exists = await client.exists(key)
      if (exists) {
        existingFixedKeys.push(key)
      }
    }

    if (existingFixedKeys.length > 0) {
      try {
        await client.unlink(existingFixedKeys)
        totalDeleted += existingFixedKeys.length
      } catch (error) {
        await client.del(existingFixedKeys)
        totalDeleted += existingFixedKeys.length
      }
      console.log(`[Clear All] Deleted ${existingFixedKeys.length} fixed keys`)
    }

    const tookMs = Date.now() - startTime
    console.log(`[Clear All] Completed: deleted ${totalDeleted} keys in ${tookMs}ms`)

    return {
      ok: true,
      deleted: totalDeleted,
      tookMs,
    }
  } catch (error) {
    console.error('[Clear All] Error:', error)
    return {
      ok: false,
      deleted: 0,
      tookMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  } finally {
    // Always release lock
    await releaseLock()
  }
}
