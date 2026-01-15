'use client'

import Link from 'next/link'
import { type WorldUI, DEFAULT_WORLD_UI } from '@/features/story/lib/worlds'

interface StoryHeaderProps {
  currentDay?: number
  onSettingsClick?: () => void
  onBackToLibrary?: () => void
  worldUI?: WorldUI
}

export default function StoryHeader({ currentDay, onSettingsClick, onBackToLibrary, worldUI }: StoryHeaderProps) {
  const ui = worldUI || DEFAULT_WORLD_UI

  return (
    <header className="story-header">
      <div className="header-content">
        <div className="header-main">
          <h1 className="chronicle-title">{ui.storyTitle}</h1>
          <p className="quest-subtitle">{ui.questLabel}：{ui.questText}</p>
        </div>
        <div className="header-meta">
          <div className="character-chips">
            <span className="character-chip">一二</span>
            <span className="character-chip">布布</span>
          </div>
          {currentDay !== undefined && currentDay > 0 && (
            <span className="day-badge">第 {currentDay} 章</span>
          )}
          {onBackToLibrary && (
            <>
              <span
                className="world-badge"
                title={ui.worldBadge}
              >
                {ui.worldBadge}
              </span>
              <Link
                href="/apps/story"
                className="back-to-library-btn"
                aria-label="故事库"
                title="故事库"
              >
                📚 故事库
              </Link>
              <Link
                href="/"
                className="back-to-library-btn"
                aria-label="返回应用"
                title="返回应用"
              >
                🏠 返回应用
              </Link>
            </>
          )}
          {onSettingsClick && (
            <button
              className="settings-gear-btn"
              onClick={onSettingsClick}
              aria-label="Settings"
              title="Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
