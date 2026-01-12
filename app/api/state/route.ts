import { NextResponse } from 'next/server'
import { loadStoryState } from '@/app/lib/storyState'

export async function GET() {
  try {
    const state = await loadStoryState()
    
    // If day is 0, return friendly default message
    if (state.day === 0) {
      return NextResponse.json({
        day: 0,
        summary: '故事尚未开始。写一句今天的事件来开启旅程。',
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      day: state.day,
      summary: state.summary,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error loading story state:', error)
    
    // Return default state on error
    return NextResponse.json({
      day: 0,
      summary: '故事尚未开始。写一句今天的事件来开启旅程。',
      updatedAt: new Date().toISOString(),
    })
  }
}
