'use client'

import { useState, useEffect } from 'react'
import LogsList from './LogsList'
import ClearAllDataModal from './ClearAllDataModal'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onDataCleared?: () => void
}

export default function SettingsDrawer({ isOpen, onClose, onDataCleared }: SettingsDrawerProps) {
  const [adminKey, setAdminKey] = useState('')
  const [view, setView] = useState<'main' | 'logs'>('main')
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  useEffect(() => {
    // Check if logging is enabled
    // Note: LOG_LLM is server-side only, so we show the button
    // and let the API handle the actual check
    setIsLoggingEnabled(true) // Always show, API will handle access control
  }, [])

  if (!isOpen) return null

  const handleLogsClick = () => {
    setView('logs')
  }

  const handleBack = () => {
    setView('main')
  }

  return (
    <>
      {/* Overlay */}
      <div className="settings-overlay" onClick={onClose} />
      
      {/* Drawer */}
      <div className="settings-drawer">
        <div className="settings-drawer-header">
          {view === 'logs' && (
            <button className="settings-back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          <h2 className="settings-drawer-title">Settings</h2>
          <button className="settings-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-drawer-content">
          {view === 'main' ? (
            <div className="settings-main">
              <div className="settings-section">
                <h3 className="settings-section-title">Admin</h3>
                <div className="settings-field">
                  <label htmlFor="admin-key">Admin Key</label>
                  <input
                    id="admin-key"
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key (stored in session)"
                    className="settings-input"
                  />
                  <p className="settings-hint">
                    Required for accessing logs in production
                  </p>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Logs</h3>
                {isLoggingEnabled ? (
                  <button
                    className="settings-action-btn"
                    onClick={handleLogsClick}
                  >
                    View LLM Logs
                  </button>
                ) : (
                  <p className="settings-disabled">
                    Logging is disabled. Set LOG_LLM=true to enable.
                  </p>
                )}
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Danger Zone</h3>
                <button
                  className="settings-action-btn settings-danger-btn"
                  onClick={() => setIsClearModalOpen(true)}
                >
                  Clean All Data
                </button>
                <p className="settings-hint">
                  Permanently delete all story data, logs, and app state
                </p>
              </div>
            </div>
          ) : (
            <LogsList adminKey={adminKey} onClose={onClose} />
          )}
        </div>
      </div>

      <ClearAllDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onSuccess={() => {
          if (onDataCleared) {
            onDataCleared()
          }
        }}
      />
    </>
  )
}
