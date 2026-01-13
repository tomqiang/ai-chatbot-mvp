'use client'

import { useState, useEffect } from 'react'

interface LogDetail {
  id: string
  ts: number
  op: string
  route: string
  model: string
  status: 'success' | 'error'
  latencyMs: number
  input: string
  output?: string
  error?: string
  day?: number
  revision?: number
  requestId?: string
  tokensIn?: number
  tokensOut?: number
}

interface LogsDetailProps {
  logId: string
  adminKey: string
  onBack: () => void
}

export default function LogsDetail({ logId, adminKey, onBack }: LogsDetailProps) {
  const [log, setLog] = useState<LogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    input: true,
    output: false,
    error: false,
  })

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true)
        setError(null)

        const headers: HeadersInit = {}
        if (adminKey) {
          headers['x-admin-key'] = adminKey
        }

        const response = await fetch(`/api/logs/${logId}`, { headers })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch log')
        }

        const data = await response.json()
        setLog(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log')
      } finally {
        setLoading(false)
      }
    }

    fetchLog()
  }, [logId, adminKey])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString()
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const toggleSection = (section: 'input' | 'output' | 'error') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (loading) {
    return <div className="logs-loading">Loading log details...</div>
  }

  if (error) {
    return (
      <div className="logs-error">
        <p>{error}</p>
        <button onClick={onBack}>Back</button>
      </div>
    )
  }

  if (!log) {
    return <div className="logs-empty">Log not found</div>
  }

  return (
    <div className="logs-detail">
      <div className="logs-detail-header">
        <button className="logs-back-btn" onClick={onBack}>
          ← Back
        </button>
        <h3>Log Details</h3>
      </div>

      <div className="logs-detail-content">
        <div className="logs-detail-meta">
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Operation:</span>
            <span className="logs-detail-value">{log.op}</span>
          </div>
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Route:</span>
            <span className="logs-detail-value">{log.route}</span>
          </div>
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Model:</span>
            <span className="logs-detail-value">{log.model}</span>
          </div>
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Status:</span>
            <span className={`logs-detail-value logs-status-${log.status}`}>
              {log.status}
            </span>
          </div>
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Latency:</span>
            <span className="logs-detail-value">{formatLatency(log.latencyMs)}</span>
          </div>
          <div className="logs-detail-meta-row">
            <span className="logs-detail-label">Timestamp:</span>
            <span className="logs-detail-value">{formatTimestamp(log.ts)}</span>
          </div>
          {log.day && (
            <div className="logs-detail-meta-row">
              <span className="logs-detail-label">Day:</span>
              <span className="logs-detail-value">{log.day}</span>
            </div>
          )}
          {log.revision && (
            <div className="logs-detail-meta-row">
              <span className="logs-detail-label">Revision:</span>
              <span className="logs-detail-value">{log.revision}</span>
            </div>
          )}
          {log.requestId && (
            <div className="logs-detail-meta-row">
              <span className="logs-detail-label">Request ID:</span>
              <span className="logs-detail-value">{log.requestId}</span>
            </div>
          )}
          {log.tokensIn !== undefined && (
            <div className="logs-detail-meta-row">
              <span className="logs-detail-label">Tokens In:</span>
              <span className="logs-detail-value">{log.tokensIn}</span>
            </div>
          )}
          {log.tokensOut !== undefined && (
            <div className="logs-detail-meta-row">
              <span className="logs-detail-label">Tokens Out:</span>
              <span className="logs-detail-value">{log.tokensOut}</span>
            </div>
          )}
        </div>

        <div className="logs-detail-sections">
          <div className="logs-detail-section">
            <div className="logs-detail-section-header">
              <button
                className="logs-detail-section-toggle"
                onClick={() => toggleSection('input')}
              >
                {expandedSections.input ? '▼' : '▶'} Input
              </button>
              <button
                className="logs-detail-copy-btn"
                onClick={() => copyToClipboard(log.input)}
              >
                Copy
              </button>
            </div>
            {expandedSections.input && (
              <pre className="logs-detail-code">{log.input}</pre>
            )}
          </div>

          {log.output && (
            <div className="logs-detail-section">
              <div className="logs-detail-section-header">
                <button
                  className="logs-detail-section-toggle"
                  onClick={() => toggleSection('output')}
                >
                  {expandedSections.output ? '▼' : '▶'} Output
                </button>
                <button
                  className="logs-detail-copy-btn"
                  onClick={() => copyToClipboard(log.output!)}
                >
                  Copy
                </button>
              </div>
              {expandedSections.output && (
                <pre className="logs-detail-code">{log.output}</pre>
              )}
            </div>
          )}

          {log.error && (
            <div className="logs-detail-section">
              <div className="logs-detail-section-header">
                <button
                  className="logs-detail-section-toggle"
                  onClick={() => toggleSection('error')}
                >
                  {expandedSections.error ? '▼' : '▶'} Error
                </button>
                <button
                  className="logs-detail-copy-btn"
                  onClick={() => copyToClipboard(log.error!)}
                >
                  Copy
                </button>
              </div>
              {expandedSections.error && (
                <pre className="logs-detail-code logs-detail-error">{log.error}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
