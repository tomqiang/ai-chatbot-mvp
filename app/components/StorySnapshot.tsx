'use client'

import { useState } from 'react'

interface StorySnapshotProps {
  day: number
  summary: string
  updatedAt?: string
}

export default function StorySnapshot({ day, summary, updatedAt }: StorySnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCopy = () => {
    const text = `Story Snapshot - Day ${day}\n\n${summary}`
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      alert('已复制到剪贴板')
    }).catch(() => {
      alert('复制失败')
    })
  }

  const isEmpty = day === 0

  return (
    <div className="story-snapshot">
      <div className="snapshot-header">
        <div className="snapshot-title-section">
          <h3 className="snapshot-title">Story Snapshot</h3>
          <p className="snapshot-subtitle">
            {isEmpty ? (
              'Not started'
            ) : (
              <>Day {day} · Main quest: 寻找「月影宝石」</>
            )}
          </p>
        </div>
        <div className="snapshot-actions">
          {!isEmpty && (
            <button
              onClick={handleCopy}
              className="snapshot-action-button"
              aria-label="Copy summary to clipboard"
            >
              📋 Copy
            </button>
          )}
          {!isEmpty && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="snapshot-action-button"
              aria-label={isExpanded ? 'Collapse summary' : 'Expand summary'}
            >
              {isExpanded ? '▲ Collapse' : '▼ Expand'}
            </button>
          )}
        </div>
      </div>
      <div className={`snapshot-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {isEmpty ? (
          <p className="snapshot-empty-message">
            还没有章节。写一句今天的事件，生成 Day 1。
          </p>
        ) : (
          <p className="snapshot-summary">{summary}</p>
        )}
      </div>
      {updatedAt && !isEmpty && (
        <div className="snapshot-footer">
          <time className="snapshot-timestamp">
            Updated: {new Date(updatedAt).toLocaleString('zh-CN')}
          </time>
        </div>
      )}
    </div>
  )
}
