'use client'

import { useEffect, useRef, useState } from 'react'
import { buildWheelSegments, type WheelSegment } from '../lib/outcomes'

interface WheelProps {
  bias: number
  allowDiscuss: boolean
  rotation: number
  isSpinning: boolean
  spinDuration: number
}

export default function Wheel({
  bias,
  allowDiscuss,
  rotation,
  isSpinning,
  spinDuration,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [segments, setSegments] = useState<WheelSegment[]>([])

  useEffect(() => {
    setSegments(buildWheelSegments(bias, allowDiscuss))
  }, [bias, allowDiscuss])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = size / 2 - 4

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw segments
    for (const segment of segments) {
      const startRad = (segment.startAngle - 90) * (Math.PI / 180)
      const endRad = (segment.endAngle - 90) * (Math.PI / 180)

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startRad, endRad)
      ctx.closePath()
      ctx.fillStyle = segment.outcome.color
      ctx.fill()

      // Draw border
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw label
      const midAngle = ((segment.startAngle + segment.endAngle) / 2 - 90) * (Math.PI / 180)
      const labelRadius = radius * 0.65
      const labelX = center + Math.cos(midAngle) * labelRadius
      const labelY = center + Math.sin(midAngle) * labelRadius

      ctx.save()
      ctx.translate(labelX, labelY)
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Emoji
      ctx.font = '24px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(segment.outcome.emoji, 0, -12)
      
      // Label text
      ctx.font = 'bold 13px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(segment.outcome.label, 0, 12)
      
      ctx.restore()
    }

    // Draw center circle
    ctx.beginPath()
    ctx.arc(center, center, 20, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw cute paw in center
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐾', center, center)
  }, [segments])

  return (
    <div className="wheel-container">
      <div className="pointer">▼</div>
      <div
        className="wheel-wrapper"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning
            ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="wheel-canvas"
        />
      </div>

      <style jsx>{`
        .wheel-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pointer {
          font-size: 28px;
          color: #ef4444;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          margin-bottom: -8px;
          z-index: 10;
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
        }

        .wheel-wrapper {
          width: 280px;
          height: 280px;
          border-radius: 50%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15),
                      inset 0 0 0 4px rgba(255, 255, 255, 0.3);
        }

        .wheel-canvas {
          display: block;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
