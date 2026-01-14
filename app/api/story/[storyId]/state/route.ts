import { NextRequest, NextResponse } from 'next/server'
import { loadStoryState } from '@/app/lib/storyState'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params
    const state = await loadStoryState(storyId)
    return NextResponse.json(state)
  } catch (error) {
    console.error('Error loading story state:', error)
    return NextResponse.json(
      { error: 'Failed to load story state' },
      { status: 500 }
    )
  }
}
