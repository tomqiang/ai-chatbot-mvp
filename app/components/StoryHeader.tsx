'use client'

interface StoryHeaderProps {
  currentDay?: number
  onSettingsClick?: () => void
}

export default function StoryHeader({ currentDay, onSettingsClick }: StoryHeaderProps) {
  return (
    <header className="story-header">
      <div className="header-content">
        <div className="header-main">
          <h1 className="chronicle-title">Moonshadow Chronicle</h1>
          <p className="quest-subtitle">Main quest: 寻找「月影宝石」</p>
        </div>
        <div className="header-meta">
          <div className="character-chips">
            <span className="character-chip">一二</span>
            <span className="character-chip">布布</span>
          </div>
          {currentDay !== undefined && currentDay > 0 && (
            <span className="day-badge">Day {currentDay}</span>
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
