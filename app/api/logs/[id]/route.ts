import { NextRequest, NextResponse } from 'next/server'
import { getLogById } from '@/app/lib/logging/llmLogger'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      )
    }

    // Get log
    const log = await getLogById(id)

    if (!log) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error fetching log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch log' },
      { status: 500 }
    )
  }
}
