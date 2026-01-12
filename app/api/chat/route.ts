import { NextRequest, NextResponse } from 'next/server'
import { 
  loadStoryState, 
  saveStoryState, 
  saveStoryEntry
} from '@/app/lib/storyState'
import { generateStory, updateSummary } from '@/app/lib/openaiHelper'

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
    const state = loadStoryState()
    const currentDay = state.day + 1

    console.log(`Generating story for Day ${currentDay}, allowFinal: ${allowFinal}`)

    // Step 1: Generate story text
    const storyText = await generateStory(
      state.summary,
      userEvent,
      currentDay,
      allowFinal
    )

    if (!storyText || storyText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate story text' },
        { status: 500 }
      )
    }

    // Step 2: Update story summary
    const newSummary = await updateSummary(
      state.summary,
      userEvent,
      storyText
    )

    // Step 3: Save story entry
    const entry = {
      day: currentDay,
      userEvent,
      storyText,
      createdAt: new Date().toISOString(),
    }
    saveStoryEntry(entry)

    // Step 4: Update and save story state
    state.day = currentDay
    state.summary = newSummary
    saveStoryState(state)

    // Return the new story entry
    return NextResponse.json({
      day: currentDay,
      storyText,
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
    const { loadStoryEntries } = await import('@/app/lib/storyState')
    const entries = loadStoryEntries()
    const state = loadStoryState()

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
