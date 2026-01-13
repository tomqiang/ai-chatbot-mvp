import { NextRequest, NextResponse } from 'next/server'
import { 
  loadStoryState, 
  saveStoryState, 
  saveStoryEntry
} from '@/app/lib/storyState'
import { generateChapterBundle } from '@/app/lib/openaiHelper'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
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

    const { message, allowFinal = false } = body

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message (today\'s event) is required' },
        { status: 400 }
      )
    }

    const userEvent = message.trim()
    if (userEvent.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (userEvent.length > 200) {
      return NextResponse.json(
        { error: 'Message is too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // Load current story state
    const state = await loadStoryState()
    const currentDay = state.day + 1

    console.log(`Generating story for Day ${currentDay}, allowFinal: ${allowFinal}`)

    // Generate request ID for logging
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Generate complete chapter bundle in a single LLM call
    const bundle = await generateChapterBundle(
      state.summary,
      userEvent,
      undefined, // latestChapterText - not needed for new chapter
      allowFinal,
      { day: currentDay, requestId }
    )

    // Save story entry
    const entry = {
      day: currentDay,
      userEvent,
      storyText: bundle.chapter,
      title: bundle.title,
      anchors: {
        a: bundle.anchors.A,
        b: bundle.anchors.B,
        c: bundle.anchors.C,
      },
      suggestions: bundle.tomorrow_suggestions.map(s => s.text),
      event_keywords: bundle.event_keywords,
      createdAt: new Date().toISOString(),
    }
    await saveStoryEntry(entry)

    // Update and save story state
    state.day = currentDay
    state.summary = bundle.next_story_state_summary
    await saveStoryState(state)

    // Return the new story entry with updated state
    return NextResponse.json({
      day: currentDay,
      title: bundle.title,
      storyText: bundle.chapter,
      summary: bundle.next_story_state_summary,
      anchors: {
        a: bundle.anchors.A,
        b: bundle.anchors.B,
        c: bundle.anchors.C,
      },
      suggestions: bundle.tomorrow_suggestions.map(s => s.text),
      updatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Error generating story:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message || 'Failed to generate story',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve all story entries
export async function GET() {
  try {
    const { loadStoryEntries, loadStoryState } = await import('@/app/lib/storyState')
    const entries = await loadStoryEntries()
    const state = await loadStoryState()

    return NextResponse.json({
      state,
      entries,
    })
  } catch (error) {
    console.error('Error loading story:', error)
    return NextResponse.json(
      { error: 'Failed to load story' },
      { status: 500 }
    )
  }
}
