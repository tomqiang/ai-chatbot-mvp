'use client'

import { type ChangeEvent } from 'react'
import OutcomeSymbol from './OutcomeSymbol'
import { calculateProbabilities } from '../lib/outcomes'

interface InputsCardProps {
  disabled?: boolean
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
  disabled = false,
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

  const probabilities = calculateProbabilities(bias, allowDiscuss)
  const percentage = (id: 'yier' | 'bubu') =>
    Number(((probabilities.find(p => p.outcomeId === id)?.probability ?? 0) * 100).toFixed(1))
  const yierPercent = percentage('yier')
  const bubuPercent = percentage('bubu')

  return (
    <fieldset className="inputs-card" disabled={disabled} aria-label="决策设置">
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
          <OutcomeSymbol id="yier" /> 一二宝宝的方案
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
          <OutcomeSymbol id="bubu" /> 布布宝宝的方案
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
        <div className="bias-heading">
          <label htmlFor="bias-slider" className="input-label">偏向调节</label>
          <button type="button" className="equal-odds" onClick={() => onBiasChange(50)}>
            ⚖️ 一人一半
          </button>
        </div>
        <div className="slider-container">
          <span className="slider-label">← 一二</span>
          <input
            id="bias-slider"
            type="range"
            min="0"
            max="100"
            value={bias}
            onChange={handleSliderChange}
            className="slider"
            aria-label="偏向调节"
            aria-valuetext={`一二 ${yierPercent}%，布布 ${bubuPercent}%`}
            aria-describedby="bias-help"
            dir="ltr"
          />
          <span className="slider-label">布布 →</span>
        </div>
        <div className="slider-info">
          <span className="slider-percent yier">一二 {yierPercent}%</span>
          <span className="slider-percent bubu">布布 {bubuPercent}%</span>

        </div>
        <p id="bias-help" className="bias-help">
          向左更偏向一二，向右更偏向布布。以上为单次概率。
          {allowDiscuss && ' 再聊10分钟占 10%。'}
        </p>
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

      {bestOf3 && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>
        三次结果各不相同时，以最后一次结果为准。
      </p>}

      <style jsx>{`
        .inputs-card {
          min-width: 0;
          margin: 0;
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

        .bias-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .bias-heading .input-label { margin-bottom: 0; }

        .equal-odds {
          padding: 7px 12px;
          border: 1px solid #c7d2fe;
          border-radius: 8px;
          background: #eef2ff;
          color: #4338ca;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .equal-odds:hover:not(:disabled) { background: #e0e7ff; }
        .equal-odds:focus-visible { outline: 2px solid #6366f1; outline-offset: 3px; }
        .equal-odds:disabled { opacity: 0.5; cursor: not-allowed; }

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

        .bias-help {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.6;
        }

        .slider-info {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
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
    </fieldset>
  )
}
