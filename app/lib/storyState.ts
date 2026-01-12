import fs from 'fs'
import path from 'path'

// Story state structure
export interface StoryState {
  day: number
  summary: string // 2-3 sentence authoritative summary
}

export interface StoryEntry {
  day: number
  userEvent: string
  storyText: string
  createdAt: string
  title?: string // Optional for backward compatibility
  suggestions?: string[] // Optional: 5 suggestions for tomorrow's event
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STATE_FILE = path.join(DATA_DIR, 'story_state.json')
const ENTRIES_FILE = path.join(DATA_DIR, 'story_entries.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Initialize default story state
function getDefaultState(): StoryState {
  return {
    day: 0,
    summary: '一二和布布是一对伴侣，他们踏上了寻找「月影宝石」的旅程。一二擅长魔法，性格沉静；布布勇敢坚强，擅长近战。他们相互扶持，在奇幻世界中前行。'
  }
}

// Load story state from file
export function loadStoryState(): StoryState {
  ensureDataDir()
  
  if (!fs.existsSync(STATE_FILE)) {
    const defaultState = getDefaultState()
    saveStoryState(defaultState)
    return defaultState
  }

  try {
    const content = fs.readFileSync(STATE_FILE, 'utf-8')
    return JSON.parse(content) as StoryState
  } catch (error) {
    console.error('Error loading story state:', error)
    return getDefaultState()
  }
}

// Save story state to file
export function saveStoryState(state: StoryState): void {
  ensureDataDir()
  
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving story state:', error)
    throw error
  }
}

// Load all story entries
export function loadStoryEntries(): StoryEntry[] {
  ensureDataDir()
  
  if (!fs.existsSync(ENTRIES_FILE)) {
    return []
  }

  try {
    const content = fs.readFileSync(ENTRIES_FILE, 'utf-8')
    return JSON.parse(content) as StoryEntry[]
  } catch (error) {
    console.error('Error loading story entries:', error)
    return []
  }
}

// Save story entries to file
export function saveStoryEntry(entry: StoryEntry): void {
  ensureDataDir()
  
  const entries = loadStoryEntries()
  entries.push(entry)
  
  try {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving story entry:', error)
    throw error
  }
}

// Update story summary
export function updateStorySummary(newSummary: string): void {
  const state = loadStoryState()
  state.summary = newSummary
  saveStoryState(state)
}
