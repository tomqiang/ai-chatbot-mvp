'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import InputsCard from './InputsCard'
import Wheel from './Wheel'
import ResultCard from './ResultCard'
import {
  pickOutcome,
  buildWheelSegments,
  determineBestOf3Winner,
  type OutcomeId,
} from '../lib/outcomes'
import { generateSpinAngle, getSpinDuration } from '../lib/spinMath'

type AppState = 'idle' | 'spinning' | 'result'

export default function DeciderApp() {
  // Input state
  const [title, setTitle] = useState('')
  const [yierPlan, setYierPlan] = useState('')
  const [bubuPlan, setBubuPlan] = useState('')
  const [bias, setBias] = useState(50)
  const [bestOf3, setBestOf3] = useState(false)
  const [allowDiscuss, setAllowDiscuss] = useState(true)

  // Spin state
  const [appState, setAppState] = useState<AppState>('idle')
  const [rotation, setRotation] = useState(0)
  const [spinDuration, setSpinDuration] = useState(0)
  const [result, setResult] = useState<OutcomeId | null>(null)
  const [bo3Results, setBo3Results] = useState<OutcomeId[]>([])

  const canSpin = yierPlan.trim().length > 0 && bubuPlan.trim().length > 0

  const performSingleSpin = useCallback((): Promise<OutcomeId> => {
    return new Promise((resolve) => {
      const outcome = pickOutcome(bias, allowDiscuss)
      const segments = buildWheelSegments(bias, allowDiscuss)
      const targetSegment = segments.find((s) => s.outcome.id === outcome)

      if (!targetSegment) {
        resolve(outcome)
        return
      }

      const angle = generateSpinAngle(targetSegment)
      const duration = getSpinDuration()

      setRotation((prev) => prev + angle)
      setSpinDuration(duration)

      setTimeout(() => {
        resolve(outcome)
      }, duration)
    })
  }, [bias, allowDiscuss])

  const handleSpin = useCallback(async () => {
    if (!canSpin || appState === 'spinning') return

    setAppState('spinning')
    setResult(null)
    setBo3Results([])

    if (bestOf3) {
      // Best of 3 mode
      const results: OutcomeId[] = []

      for (let i = 0; i < 3; i++) {
        const outcome = await performSingleSpin()
        results.push(outcome)

        if (i < 2) {
          // Pause between spins
          await new Promise((resolve) => setTimeout(resolve, 600))
        }
      }

      const winner = determineBestOf3Winner(results)
      setBo3Results(results)
      setResult(winner)
      setAppState('result')
    } else {
      // Single spin mode
      const outcome = await performSingleSpin()
      setResult(outcome)
      setAppState('result')
    }
  }, [canSpin, appState, bestOf3, performSingleSpin])

  const handleSpinAgain = useCallback(() => {
    setAppState('idle')
    setResult(null)
    setBo3Results([])
  }, [])

  const handleClear = useCallback(() => {
    setTitle('')
    setYierPlan('')
    setBubuPlan('')
    setBias(50)
    setBestOf3(false)
    setAllowDiscuss(true)
    setAppState('idle')
    setResult(null)
    setBo3Results([])
    setRotation(0)
  }, [])

  return (
    <div className="decider-app">
      <header className="app-header">
        <h1 className="app-title">🎡 一二布布决策转盘</h1>
        <Link href="/" className="back-link">
          返回应用
        </Link>
      </header>

      <main className="app-main">
        {title && (
          <div className="dispute-title">
            <span className="dispute-label">本次分歧：</span>
            <span className="dispute-text">{title}</span>
          </div>
        )}

        <InputsCard
          title={title}
          yierPlan={yierPlan}
          bubuPlan={bubuPlan}
          bias={bias}
          bestOf3={bestOf3}
          allowDiscuss={allowDiscuss}
          onTitleChange={setTitle}
          onYierPlanChange={setYierPlan}
          onBubuPlanChange={setBubuPlan}
          onBiasChange={setBias}
          onBestOf3Change={setBestOf3}
          onAllowDiscussChange={setAllowDiscuss}
        />

        <div className="wheel-section">
          <Wheel
            bias={bias}
            allowDiscuss={allowDiscuss}
            rotation={rotation}
            isSpinning={appState === 'spinning'}
            spinDuration={spinDuration}
          />

          <button
            className="spin-button"
            onClick={handleSpin}
            disabled={!canSpin || appState === 'spinning'}
          >
            {appState === 'spinning' ? '转动中...' : bestOf3 ? '开转！(三局两胜)' : '开转！'}
          </button>

          {!canSpin && (
            <p className="spin-hint">请先填写两个方案</p>
          )}
        </div>

        {appState === 'result' && result && (
          <ResultCard
            outcomeId={result}
            yierPlan={yierPlan}
            bubuPlan={bubuPlan}
            bestOf3Results={bo3Results.length === 3 ? bo3Results : undefined}
            onSpinAgain={handleSpinAgain}
            onClear={handleClear}
          />
        )}
      </main>

      <style jsx>{`
        .decider-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%);
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .app-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .back-link {
          font-size: 14px;
          color: #6b7280;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .back-link:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .app-main {
          max-width: 420px;
          margin: 0 auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dispute-title {
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .dispute-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .dispute-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-left: 8px;
        }

        .wheel-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          background: white;
          border-radius: 20px;
          padding: 32px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .spin-button {
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #60a5fa 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 16px rgba(244, 114, 182, 0.4);
        }

        .spin-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(244, 114, 182, 0.5);
        }

        .spin-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .spin-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .spin-button:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(244, 114, 182, 0.3),
                      0 4px 16px rgba(244, 114, 182, 0.4);
        }

        .spin-hint {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }

        @media (max-width: 480px) {
          .app-header {
            padding: 12px 16px;
          }

          .app-title {
            font-size: 16px;
          }

          .app-main {
            padding: 16px 12px;
          }
        }
      `}</style>
    </div>
  )
}
