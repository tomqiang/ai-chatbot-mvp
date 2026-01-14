import { NextResponse } from 'next/server'
import { listStories } from '@/app/lib/storyState'

export async function GET() {
  try {
    const stories = await listStories()
    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Error loading stories:', error)
    return NextResponse.json(
      { error: 'Failed to load stories' },
      { status: 500 }
    )
  }
}
