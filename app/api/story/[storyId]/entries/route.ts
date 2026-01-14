import { NextRequest, NextResponse } from 'next/server'
import { loadStoryEntries } from '@/app/lib/storyState'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params
    const entries = await loadStoryEntries(storyId)
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error loading story entries:', error)
    return NextResponse.json(
      { error: 'Failed to load story entries' },
      { status: 500 }
    )
  }
}
