'use server'

import { createStory, setActiveStoryId, getStoryMeta } from '@/features/story/lib/kvStorage'
import { getWorldById } from '@/features/story/lib/worlds'

export async function startNewStory(worldId: string) {
  try {
    // Validate world exists
    const world = getWorldById(worldId)
    if (!world) {
      return { error: `Invalid world ID: ${worldId}` }
    }

    // Generate storyId
    const storyId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Create story
    await createStory(storyId, worldId, world.initialSummary)

    return { success: true, storyId }
  } catch (error) {
    console.error('Error starting new story:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to start new story' 
    }
  }
}

export async function continueStory(storyId: string) {
  try {
    // Validate story exists
    const meta = await getStoryMeta(storyId)
    if (!meta) {
      return { error: `Story ${storyId} does not exist` }
    }

    // Set as active
    await setActiveStoryId(storyId)

    return { success: true, storyId }
  } catch (error) {
    console.error('Error continuing story:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to continue story' 
    }
  }
}
