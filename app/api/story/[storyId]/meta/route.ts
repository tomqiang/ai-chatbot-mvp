import { NextRequest, NextResponse } from 'next/server'
import { getStoryMeta } from '@/app/lib/storyState'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params
    const meta = await getStoryMeta(storyId)
    
    if (!meta) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(meta)
  } catch (error) {
    console.error('Error loading story meta:', error)
    return NextResponse.json(
      { error: 'Failed to load story' },
      { status: 500 }
    )
  }
}
