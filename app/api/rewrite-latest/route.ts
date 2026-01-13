import { NextRequest, NextResponse } from 'next/server'
import { 
  loadStoryState, 
  saveStoryState, 
  loadStoryEntries,
  updateStoryEntry,
  getStoryEntryByDay
} from '@/app/lib/storyState'
import { 
  generateStory, 
  updateSummaryTitleAndSuggestions,
  generateSummaryUpToDay
} from '@/app/lib/openaiHelper'

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

    const { newEvent } = body

    // Validate input
    if (!newEvent || typeof newEvent !== 'string') {
      return NextResponse.json(
        { error: 'newEvent is required' },
        { status: 400 }
      )
    }

    const userEvent = newEvent.trim()
    if (userEvent.length === 0) {
      return NextResponse.json(
        { error: 'newEvent cannot be empty' },
        { status: 400 }
      )
    }

    if (userEvent.length > 200) {
      return NextResponse.json(
        { error: 'newEvent is too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // Load current story state
    const state = await loadStoryState()
    const lastDay = state.day

    // Validate: only rewrite latest day
    if (lastDay === 0) {
      return NextResponse.json(
        { error: 'No story entries to rewrite. Please generate a chapter first.' },
        { status: 400 }
      )
    }

    // Load latest entry
    const latestEntry = await getStoryEntryByDay(lastDay)
    if (!latestEntry) {
      return NextResponse.json(
        { error: 'State mismatch: latest entry missing.' },
        { status: 500 }
      )
    }

    console.log(`Rewriting Day ${lastDay} with new event: ${userEvent}`)

    // Generate request ID for logging
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Step 1: Generate summary up to previous day
    const allEntries = await loadStoryEntries()
    const summaryUpToPrevDay = await generateSummaryUpToDay(
      allEntries.map(e => ({ day: e.day, userEvent: e.userEvent, storyText: e.storyText })),
      lastDay
    )

    // Step 2: Generate rewritten story text
    const storyText = await generateStory(
      summaryUpToPrevDay,
      userEvent,
      lastDay,
      false, // Never allow final on rewrite
      { requestId }
    )

    if (!storyText || storyText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate story text' },
        { status: 500 }
      )
    }

    // Step 3: Generate updated metadata (summary, title, anchored suggestions)
    const { summary: newSummary, title, anchors, suggestions } = await updateSummaryTitleAndSuggestions(
      summaryUpToPrevDay,
      userEvent,
      storyText,
      { day: lastDay, revision: latestEntry.revision || 1, requestId }
    )

    // Step 4: Update latest entry
    const currentRevision = latestEntry.revision || 1
    const now = new Date().toISOString()
    
    await updateStoryEntry(lastDay, {
      userEvent,
      storyText,
      title,
      anchors,
      suggestions,
      revision: currentRevision + 1,
      updatedAt: now,
    })

    // Step 5: Update story state
    state.summary = newSummary
    await saveStoryState(state)

    // Return the rewritten entry
    return NextResponse.json({
      day: lastDay,
      revision: currentRevision + 1,
      storyText,
      summary: newSummary,
      title,
      anchors,
      suggestions,
      updatedAt: now,
    })
  } catch (error: unknown) {
    console.error('Error rewriting story:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message || 'Failed to rewrite story',
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
