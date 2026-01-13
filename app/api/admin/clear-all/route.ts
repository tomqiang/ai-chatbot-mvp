import { NextRequest, NextResponse } from 'next/server'
import { clearAllData } from '@/app/lib/admin/clearAllData'

export async function POST(request: NextRequest) {
  try {
    // Validate admin secret header
    const adminSecret = process.env.ADMIN_CLEAR_SECRET
    const providedSecret = request.headers.get('x-admin-secret')

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin clear secret not configured' },
        { status: 500 }
      )
    }

    if (!providedSecret || providedSecret !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate confirmText
    if (body.confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid confirmation text' },
        { status: 400 }
      )
    }

    // Perform clear operation
    const result = await clearAllData()

    if (!result.ok) {
      // Check if it's a lock conflict
      if (result.error?.includes('in progress')) {
        return NextResponse.json(
          { error: result.error },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: result.error || 'Failed to clear data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      tookMs: result.tookMs,
    })
  } catch (error) {
    console.error('Error in clear-all endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
