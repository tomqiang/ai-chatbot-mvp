'use client'

import { type ChangeEvent } from 'react'

interface InputsCardProps {
  title: string
  yierPlan: string
  bubuPlan: string
  bias: number
  bestOf3: boolean
  allowDiscuss: boolean
  onTitleChange: (value: string) => void
  onYierPlanChange: (value: string) => void
  onBubuPlanChange: (value: string) => void
  onBiasChange: (value: number) => void
  onBestOf3Change: (value: boolean) => void
  onAllowDiscussChange: (value: boolean) => void
}

export default function InputsCard({
  title,
  yierPlan,
  bubuPlan,
  bias,
  bestOf3,
  allowDiscuss,
  onTitleChange,
  onYierPlanChange,
  onBubuPlanChange,
  onBiasChange,
  onBestOf3Change,
  onAllowDiscussChange,
}: InputsCardProps) {
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    onBiasChange(parseInt(e.target.value, 10))
  }

  const yierPercent = Math.round((1 - bias / 100) * 75 + (allowDiscuss ? 0 : 7.5))
  const bubuPercent = Math.round((bias / 100) * 75 + (allowDiscuss ? 0 : 7.5))

  return (
    <div className="inputs-card">
      <div className="input-group">
        <label htmlFor="dispute-title" className="input-label">
          分歧标题（可选）
        </label>
        <input
          id="dispute-title"
          type="text"
          className="text-input"
          placeholder="例如：周末去哪里玩"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label htmlFor="yier-plan" className="input-label">
          🌙 一二的方案
        </label>
        <textarea
          id="yier-plan"
          className="text-input textarea"
          placeholder="一二想要..."
          value={yierPlan}
          onChange={(e) => onYierPlanChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="input-group">
        <label htmlFor="bubu-plan" className="input-label">
          🛡️ 布布的方案
        </label>
        <textarea
          id="bubu-plan"
          className="text-input textarea"
          placeholder="布布想要..."
          value={bubuPlan}
          onChange={(e) => onBubuPlanChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="input-group">
        <label className="input-label">
          偏向调节
        </label>
        <div className="slider-container">
          <span className="slider-label">一二</span>
          <input
            type="range"
            min="0"
            max="100"
            value={bias}
            onChange={handleSliderChange}
            className="slider"
            aria-label="偏向调节"
          />
          <span className="slider-label">布布</span>
        </div>
        <div className="slider-info">
          <span className="slider-percent yier">一二 {yierPercent}%</span>
          <span className="slider-percent bubu">布布 {bubuPercent}%</span>
        </div>
      </div>

      <div className="toggles">
        <label className="toggle-item">
          <input
            type="checkbox"
            checked={bestOf3}
            onChange={(e) => onBestOf3Change(e.target.checked)}
          />
          <span className="toggle-label">🎲 三局两胜</span>
        </label>
        <label className="toggle-item">
          <input
            type="checkbox"
            checked={allowDiscuss}
            onChange={(e) => onAllowDiscussChange(e.target.checked)}
          />
          <span className="toggle-label">⏳ 允许「再聊10分钟」</span>
        </label>
      </div>

      <style jsx>{`
        .inputs-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .text-input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          transition: border-color 0.2s;
          outline: none;
        }

        .text-input:focus {
          border-color: #667eea;
        }

        .textarea {
          resize: vertical;
          min-height: 60px;
          line-height: 1.5;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slider-label {
          font-size: 13px;
          color: #6b7280;
          min-width: 32px;
        }

        .slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, #667eea, #48bb78);
          border-radius: 4px;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: white;
          border: 3px solid #667eea;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: white;
          border: 3px solid #667eea;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .slider-info {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .slider-percent {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .slider-percent.yier {
          background: rgba(102, 126, 234, 0.15);
          color: #667eea;
        }

        .slider-percent.bubu {
          background: rgba(72, 187, 120, 0.15);
          color: #38a169;
        }

        .toggles {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid #f3f4f6;
        }

        .toggle-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .toggle-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accent-color: #667eea;
          cursor: pointer;
        }

        .toggle-label {
          font-size: 14px;
          color: #374151;
        }
      `}</style>
    </div>
  )
}
