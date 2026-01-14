// Re-export types and async functions from KV storage
export type { StoryState, StoryEntry, StoryMeta } from './kvStorage'
export {
  getActiveStoryId,
  setActiveStoryId,
  listStories,
  getStoryMeta,
  createStory,
  loadStoryState,
  saveStoryState,
  loadStoryEntries,
  saveStoryEntry,
  updateStoryEntry,
  getStoryEntryByDay,
} from './kvStorage'
