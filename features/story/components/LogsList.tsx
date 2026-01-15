'use client'

import { useState, useEffect } from 'react'
import LogsDetail from './LogsDetail'

interface LogItem {
  id: string
  ts: number
  op: string
  route: string
  model: string
  status: 'success' | 'error'
  latencyMs: number
  day?: number
  revision?: number
  requestId?: string
  tokensIn?: number
  tokensOut?: number
}

interface LogsListProps {
  adminKey: string
  onClose: () => void
}

export default function LogsList({ adminKey, onClose }: LogsListProps) {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<number | undefined>()
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchLogs = async (cursor?: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const headers: HeadersInit = {}
      if (adminKey) {
        headers['x-admin-key'] = adminKey
      }

      const params = new URLSearchParams({
        limit: '20',
      })
      if (cursor) {
        params.append('cursor', cursor.toString())
      }

      const response = await fetch(`/api/logs?${params}`, { headers })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch logs')
      }

      const data = await response.json()
      
      if (append) {
        setLogs(prev => [...prev, ...data.items])
      } else {
        setLogs(data.items)
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchLogs(nextCursor, true)
    }
  }

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString()
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (selectedLogId) {
    return (
      <LogsDetail
        logId={selectedLogId}
        adminKey={adminKey}
        onBack={() => setSelectedLogId(null)}
      />
    )
  }

  return (
    <div className="logs-list">
      <div className="logs-list-header">
        <h3>LLM Call Logs</h3>
        <button className="logs-close-btn" onClick={onClose}>
          Close
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="logs-loading">Loading logs...</div>
      ) : error ? (
        <div className="logs-error">
          <p>{error}</p>
          <button onClick={() => fetchLogs()}>Retry</button>
        </div>
      ) : logs.length === 0 ? (
        <div className="logs-empty">No logs found</div>
      ) : (
        <>
          <div className="logs-items">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`logs-item logs-item-${log.status}`}
                onClick={() => setSelectedLogId(log.id)}
              >
                <div className="logs-item-header">
                  <span className="logs-item-op">{log.op}</span>
                  <span className={`logs-item-status logs-status-${log.status}`}>
                    {log.status}
                  </span>
                </div>
                <div className="logs-item-meta">
                  <span>{formatTimestamp(log.ts)}</span>
                  <span>{log.model}</span>
                  <span>{formatLatency(log.latencyMs)}</span>
                  {log.day && <span>第 {log.day} 章</span>}
                </div>
                <div className="logs-item-route">{log.route}</div>
              </div>
            ))}
          </div>

          {nextCursor && (
            <button
              className="logs-load-more-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
