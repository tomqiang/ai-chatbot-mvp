'use client'

interface StoryEntryProps {
  entry: {
    day: number
    userEvent: string
    storyText: string
    createdAt: string
    revision?: number
    updatedAt?: string
    title?: string // Optional for backward compatibility
    anchors?: {
      a: string
      b: string
      c: string
    }
    suggestions?: string[] // Optional: suggestions for tomorrow
  }
  onSuggestionSelect?: (suggestion: string) => void
  onRewrite?: () => void
  isLatest?: boolean // Only show suggestions and rewrite button for the latest entry
}

export default function StoryEntry({ entry, onSuggestionSelect, onRewrite, isLatest = false }: StoryEntryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCopy = () => {
    const titleText = entry.title ? `Day ${entry.day} · ${entry.title}` : `Day ${entry.day}`
    const text = `${titleText}\n\n${entry.userEvent}\n\n${entry.storyText}`
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      alert('已复制到剪贴板')
    })
  }

  // Fallback title for backward compatibility
  const displayTitle = entry.title || `第${entry.day}章`

  return (
    <article className="chronicle-entry">
      <header className="entry-header">
        <h2 className="entry-day">
          Day {entry.day}{entry.title ? ` · ${entry.title}` : ''}
        </h2>
        <time className="entry-timestamp">{formatDate(entry.createdAt)}</time>
      </header>
      <div className="entry-prompt">
        <em>Today's event: {entry.userEvent}</em>
      </div>
      <div className="entry-content">
        {entry.storyText.split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>
      <div className="entry-actions">
        <button onClick={handleCopy} className="action-button copy-button">
          Copy Chapter
        </button>
        {isLatest && onRewrite && (
          <button onClick={onRewrite} className="action-button rewrite-button">
            Rewrite Latest
          </button>
        )}
        {entry.revision && entry.revision > 1 && (
          <span className="revision-badge">Revision {entry.revision}</span>
        )}
      </div>

      {/* Anchors (only for latest entry) */}
      {isLatest && entry.anchors && (
        <div className="entry-anchors">
          <div className="entry-anchors-label">Anchors:</div>
          <div className="entry-anchors-list">
            <span className="entry-anchor-item">
              <strong>A:</strong> {entry.anchors.a}
            </span>
            <span className="entry-anchor-item">
              <strong>B:</strong> {entry.anchors.b}
            </span>
            <span className="entry-anchor-item">
              <strong>C:</strong> {entry.anchors.c}
            </span>
          </div>
        </div>
      )}

      {/* Suggestions (only for latest entry) */}
      {isLatest && entry.suggestions && entry.suggestions.length > 0 && onSuggestionSelect && (
        <div className="entry-suggestions">
          <h4 className="suggestions-subtitle">Tomorrow suggestions</h4>
          <div className="suggestions-chips">
            {entry.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionSelect(suggestion)}
                className="suggestion-chip"
                aria-label={`Select suggestion: ${suggestion}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
