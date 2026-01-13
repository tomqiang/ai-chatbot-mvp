import { NextRequest, NextResponse } from 'next/server'
import { getLogs } from '@/app/lib/logging/llmLogger'

// Check if admin key is required and valid
function checkAdminAccess(request: NextRequest): boolean {
  // In development, allow access without admin key
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // If ADMIN_KEY is set, require it
  const adminKey = process.env.ADMIN_KEY
  if (adminKey) {
    const providedKey = request.headers.get('x-admin-key')
    return providedKey === adminKey
  }

  // In production without ADMIN_KEY, deny access
  return false
}

export async function GET(request: NextRequest) {
  try {
    // Check access
    if (!checkAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin key required in production.' },
        { status: 401 }
      )
    }

    // Check if logging is enabled
    if (process.env.LOG_LLM !== 'true') {
      return NextResponse.json(
        { error: 'Logging is not enabled. Set LOG_LLM=true to enable.' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const status = (searchParams.get('status') as 'all' | 'error') || 'all'
    const op = searchParams.get('op') || undefined

    // Get logs
    const result = await getLogs({
      cursor,
      limit,
      status,
      op,
    })

    // Return lightweight items (no full input/output)
    const items = result.items.map(log => ({
      id: log.id,
      ts: log.ts,
      op: log.op,
      route: log.route,
      model: log.model,
      status: log.status,
      latencyMs: log.latencyMs,
      day: log.day,
      revision: log.revision,
      requestId: log.requestId,
      tokensIn: log.tokensIn,
      tokensOut: log.tokensOut,
    }))

    return NextResponse.json({
      items,
      nextCursor: result.nextCursor,
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
