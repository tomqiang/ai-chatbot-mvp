import { createClient } from 'redis'

// Redis client for logging (reuse connection pattern)
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
      console.error('Redis Logger Client Error:', err)
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

// Constants
const INDEX_KEY = 'llm:logs:index'
const LOG_PREFIX = 'llm:log:'
const RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours

// Redact sensitive information
function redactSensitive(text: string): string {
  if (!text) return text
  
  // Mask API keys (sk-...)
  let redacted = text.replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***')
  
  // Mask long token-like sequences (32+ alphanumeric chars)
  redacted = redacted.replace(/\b[a-zA-Z0-9]{32,}\b/g, '***')
  
  return redacted
}

// Truncate string to max length
function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...[truncated]'
}

export interface LLMLogMeta {
  day?: number
  revision?: number
  requestId?: string
  [key: string]: unknown
}

export interface LLMLogInput {
  op: string // "chapter" | "metadata" | "rewrite"
  route: string // API route path
  model: string // OpenAI model name
  input: string | unknown // Input to LLM
  meta?: LLMLogMeta
}

export interface LLMLogResult {
  id: string
  ts: number
  op: string
  route: string
  model: string
  status: 'success' | 'error'
  latencyMs: number
  input: string
  output?: string
  error?: string
  day?: number
  revision?: number
  requestId?: string
  tokensIn?: number
  tokensOut?: number
}

// Generate unique log ID
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Log LLM call to Redis
async function logToRedis(result: LLMLogResult): Promise<void> {
  // Check if logging is enabled
  if (process.env.LOG_LLM !== 'true') {
    console.log('[LLM Logger] Logging disabled (LOG_LLM !== true)')
    return
  }

  console.log('[LLM Logger] Attempting to log:', { op: result.op, route: result.route, status: result.status })

  try {
    const client = await getRedisClient()
    const logId = result.id
    const hashKey = `${LOG_PREFIX}${logId}`
    const nowMs = Date.now()

    // Prepare hash fields
    const hashData: Record<string, string> = {
      ts: result.ts.toString(),
      route: result.route,
      op: result.op,
      model: result.model,
      status: result.status,
      latencyMs: result.latencyMs.toString(),
      input: truncate(redactSensitive(String(result.input)), 8000),
    }

    if (result.output) {
      hashData.output = truncate(redactSensitive(String(result.output)), 8000)
    }
    if (result.error) {
      hashData.error = truncate(redactSensitive(String(result.error)), 8000)
    }
    if (result.day !== undefined) {
      hashData.day = result.day.toString()
    }
    if (result.revision !== undefined) {
      hashData.revision = result.revision.toString()
    }
    if (result.requestId) {
      hashData.requestId = result.requestId
    }
    if (result.tokensIn !== undefined) {
      hashData.tokensIn = result.tokensIn.toString()
    }
    if (result.tokensOut !== undefined) {
      hashData.tokensOut = result.tokensOut.toString()
    }

    // Use pipeline for atomic operations
    const pipeline = client.multi()
    
    // Add to index (ZSET) - use timestamp as score
    pipeline.zAdd(INDEX_KEY, {
      score: nowMs,
      value: logId,
    })

    // Store log data (HASH)
    pipeline.hSet(hashKey, hashData)

    // Set expiration (24 hours)
    pipeline.expire(hashKey, 86400)

    // Prune old entries from index
    const cutoffMs = nowMs - RETENTION_MS
    pipeline.zRemRangeByScore(INDEX_KEY, '-inf', cutoffMs)

    const execResult = await pipeline.exec()
    console.log('[LLM Logger] Successfully logged:', { 
      id: logId, 
      op: result.op, 
      score: nowMs,
      execResult: execResult ? 'ok' : 'failed'
    })
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[LLM Logger] Failed to log LLM call:', error)
    if (error instanceof Error) {
      console.error('[LLM Logger] Error details:', error.message, error.stack)
    }
  }
}

// Wrapper function to log LLM calls
export async function callLLMWithLog<T>(
  { op, route, model, input, meta = {} }: LLMLogInput,
  fnCallOpenAI: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  const logId = generateLogId()
  const requestId = meta.requestId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  let output: T | undefined
  let error: Error | undefined
  let tokensIn: number | undefined
  let tokensOut: number | undefined

  try {
    output = await fnCallOpenAI()
    
    // Try to extract token usage from OpenAI response
    if (output && typeof output === 'object' && 'usage' in output) {
      const usage = (output as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage
      if (usage) {
        tokensIn = usage.prompt_tokens
        tokensOut = usage.completion_tokens
      }
    }

    const latencyMs = Date.now() - startTime

    // Log success
    await logToRedis({
      id: logId,
      ts: startTime,
      op,
      route,
      model,
      status: 'success',
      latencyMs,
      input: typeof input === 'string' ? input : JSON.stringify(input),
      output: typeof output === 'string' ? output : JSON.stringify(output),
      day: meta.day,
      revision: meta.revision,
      requestId,
      tokensIn,
      tokensOut,
    })

    return output
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    const latencyMs = Date.now() - startTime

    // Log error
    await logToRedis({
      id: logId,
      ts: startTime,
      op,
      route,
      model,
      status: 'error',
      latencyMs,
      input: typeof input === 'string' ? input : JSON.stringify(input),
      error: error.message,
      day: meta.day,
      revision: meta.revision,
      requestId,
      tokensIn,
      tokensOut,
    })

    throw error
  }
}

// Get logs from Redis
export async function getLogs(options: {
  cursor?: number
  limit?: number
  status?: 'all' | 'error'
  op?: string
}): Promise<{ items: LLMLogResult[]; nextCursor?: number }> {
  const { cursor, limit = 20, status = 'all', op } = options

  try {
    const client = await getRedisClient()
    const nowMs = Date.now()
    const cutoffMs = nowMs - RETENTION_MS

    console.log('[LLM Logger] Fetching logs:', { cursor, limit, status, op, cutoffMs, nowMs })

    // Get log IDs from index (most recent first)
    // Get all items with scores, then filter by range
    const maxScore = cursor ? cursor : nowMs
    const minScore = cutoffMs
    
    // Get all items with their scores (zRange with WITHSCORES)
    const allItems = await client.zRangeWithScores(INDEX_KEY, 0, -1) as Array<{ value: string; score: number }>
    
    // Filter by score range and sort by score descending (newest first)
    const filteredItems = allItems
      .filter(item => item.score >= minScore && item.score <= maxScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit + 1)
    
    const logIds = filteredItems.map(item => item.value)
    
    console.log('[LLM Logger] Found log IDs:', logIds.length, 'from', allItems.length, 'total items, filtered by range', { minScore, maxScore, indexKey: INDEX_KEY })

    const hasMore = logIds.length > limit
    const idsToFetch = hasMore ? logIds.slice(0, limit) : logIds

    if (idsToFetch.length === 0) {
      console.log('[LLM Logger] No log IDs to fetch')
      return { items: [] }
    }

    console.log('[LLM Logger] Fetching details for', idsToFetch.length, 'logs')

    // Fetch log details in parallel
    const pipeline = client.multi()
    idsToFetch.forEach((id: string) => {
      pipeline.hGetAll(`${LOG_PREFIX}${id}`)
    })
    const results = await pipeline.exec()
    
    console.log('[LLM Logger] Retrieved', results.length, 'log details')

    // Parse and filter logs
    const items: LLMLogResult[] = []
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        // Convert Buffer values to strings if needed
        const logData: Record<string, string> = {}
        for (const [key, value] of Object.entries(result)) {
          logData[key] = typeof value === 'string' ? value : String(value)
        }
        const log: LLMLogResult = {
          id: idsToFetch[i],
          ts: parseInt(logData.ts || '0'),
          op: logData.op || '',
          route: logData.route || '',
          model: logData.model || '',
          status: (logData.status as 'success' | 'error') || 'success',
          latencyMs: parseInt(logData.latencyMs || '0'),
          input: logData.input || '',
          output: logData.output,
          error: logData.error,
          day: logData.day ? parseInt(logData.day) : undefined,
          revision: logData.revision ? parseInt(logData.revision) : undefined,
          requestId: logData.requestId,
          tokensIn: logData.tokensIn ? parseInt(logData.tokensIn) : undefined,
          tokensOut: logData.tokensOut ? parseInt(logData.tokensOut) : undefined,
        }

        // Apply filters
        if (status === 'error' && log.status !== 'error') continue
        if (op && log.op !== op) continue

        items.push(log)
      }
    }

    // Sort by timestamp descending
    items.sort((a, b) => b.ts - a.ts)

    // Determine next cursor
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].ts : undefined

    return { items, nextCursor }
  } catch (error) {
    console.error('Failed to get logs:', error)
    return { items: [] }
  }
}

// Get single log by ID
export async function getLogById(id: string): Promise<LLMLogResult | null> {
  try {
    const client = await getRedisClient()
    const rawData = await client.hGetAll(`${LOG_PREFIX}${id}`)

    if (!rawData || Object.keys(rawData).length === 0) {
      return null
    }

    // Convert Buffer values to strings if needed
    const logData: Record<string, string> = {}
    for (const [key, value] of Object.entries(rawData)) {
      logData[key] = typeof value === 'string' ? value : String(value)
    }

    return {
      id,
      ts: parseInt(logData.ts || '0'),
      op: logData.op || '',
      route: logData.route || '',
      model: logData.model || '',
      status: (logData.status as 'success' | 'error') || 'success',
      latencyMs: parseInt(logData.latencyMs || '0'),
      input: logData.input || '',
      output: logData.output,
      error: logData.error,
      day: logData.day ? parseInt(logData.day) : undefined,
      revision: logData.revision ? parseInt(logData.revision) : undefined,
      requestId: logData.requestId,
      tokensIn: logData.tokensIn ? parseInt(logData.tokensIn) : undefined,
      tokensOut: logData.tokensOut ? parseInt(logData.tokensOut) : undefined,
    }
  } catch (error) {
    console.error('Failed to get log by ID:', error)
    return null
  }
}
