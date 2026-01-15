'use client'

import { useState } from 'react'
import { DEFAULT_WORLD_UI } from '@/features/story/lib/worlds'

interface StorySnapshotProps {
  day: number
  summary: string
  updatedAt?: string
  questLabel?: string
  questText?: string
}

export default function StorySnapshot({ day, summary, updatedAt, questLabel, questText }: StorySnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const label = questLabel || DEFAULT_WORLD_UI.questLabel
  const text = questText || DEFAULT_WORLD_UI.questText

  const handleCopy = () => {
    const copyText = `故事快照 - 第 ${day} 章\n\n${summary}`
    navigator.clipboard.writeText(copyText).then(() => {
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
          <h3 className="snapshot-title">故事快照</h3>
          <p className="snapshot-subtitle">
            {isEmpty ? (
              '尚未开始'
            ) : (
              <>第 {day} 章 · {label}：{text}</>
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
            还没有章节。写一句事件描述，生成第 1 章。
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
