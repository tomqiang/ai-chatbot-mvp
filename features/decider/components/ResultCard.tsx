'use client'

import { OUTCOMES, type OutcomeId } from '../lib/outcomes'

interface ResultCardProps {
  outcomeId: OutcomeId
  yierPlan: string
  bubuPlan: string
  bestOf3Results?: OutcomeId[]
  onSpinAgain: () => void
  onClear: () => void
}

export default function ResultCard({
  outcomeId,
  yierPlan,
  bubuPlan,
  bestOf3Results,
  onSpinAgain,
  onClear,
}: ResultCardProps) {
  const outcome = OUTCOMES[outcomeId]

  // Determine which plan to show
  let planToShow = ''
  if (outcomeId === 'yier' && yierPlan) {
    planToShow = yierPlan
  } else if (outcomeId === 'bubu' && bubuPlan) {
    planToShow = bubuPlan
  } else if (outcomeId === 'compromise') {
    if (yierPlan && bubuPlan) {
      planToShow = `一二方案：${yierPlan}\n布布方案：${bubuPlan}`
    }
  }

  return (
    <div className="result-card" style={{ borderColor: outcome.color }}>
      <div className="result-emoji">{outcome.emoji}</div>
      <h3 className="result-title" style={{ color: outcome.color }}>
        {outcome.resultTitle}
      </h3>

      {planToShow && (
        <div className="plan-box">
          <p className="plan-text">{planToShow}</p>
        </div>
      )}

      <div className="instruction-box">
        <p className="instruction-text">{outcome.instruction}</p>
      </div>

      {bestOf3Results && bestOf3Results.length === 3 && (
        <div className="bo3-breakdown">
          <h4 className="bo3-title">三局两胜明细</h4>
          <div className="bo3-list">
            {bestOf3Results.map((r, i) => {
              const o = OUTCOMES[r]
              return (
                <div key={i} className="bo3-item">
                  <span className="bo3-round">第{i + 1}次</span>
                  <span className="bo3-result" style={{ color: o.color }}>
                    {o.emoji} {o.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="result-actions">
        <button className="action-btn spin-again" onClick={onSpinAgain}>
          🎡 再转一次
        </button>
        <button className="action-btn clear" onClick={onClear}>
          清空
        </button>
      </div>

      <style jsx>{`
        .result-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 3px solid;
          text-align: center;
          animation: fadeInUp 0.4s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-emoji {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .result-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .plan-box {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: left;
        }

        .plan-text {
          font-size: 15px;
          color: #374151;
          line-height: 1.6;
          margin: 0;
          white-space: pre-line;
        }

        .instruction-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .instruction-text {
          font-size: 14px;
          color: #92400e;
          line-height: 1.6;
          margin: 0;
          font-weight: 500;
        }

        .bo3-breakdown {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .bo3-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .bo3-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bo3-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
        }

        .bo3-round {
          font-size: 13px;
          color: #9ca3af;
        }

        .bo3-result {
          font-size: 14px;
          font-weight: 600;
        }

        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .action-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .action-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }

        .spin-again {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .spin-again:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .clear {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .clear:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  )
}
