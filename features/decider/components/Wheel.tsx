'use client'

import { useEffect, useRef, useState } from 'react'
import { buildWheelSegments, OUTCOMES, type WheelSegment } from '../lib/outcomes'

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

  const [portraits, setPortraits] = useState<Record<string, HTMLImageElement>>({})

  useEffect(() => {
    let active = true
    const images = Object.values(OUTCOMES).filter(outcome => outcome.image).map(outcome => {
      const image = new Image()
      image.onload = () => {
        if (active) setPortraits(previous => ({ ...previous, [outcome.id]: image }))
      }
      image.src = outcome.image!
      return image
    })
    return () => {
      active = false
      images.forEach(image => { image.onload = null })
    }
  }, [])

  useEffect(() => {
    setSegments(buildWheelSegments(bias, allowDiscuss))
  }, [bias, allowDiscuss])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 280
    ctx.setTransform(canvas.width / size, 0, 0, canvas.height / size, 0, 0)
    const center = size / 2
    const radius = size / 2 - 4

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw segments
    for (const segment of segments) {
      if (segment.probability <= 0) continue
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
      
      const portrait = portraits[segment.outcome.id]
      if (portrait) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, -14, 22, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(portrait, -22, -36, 44, 44)
        ctx.restore()
        ctx.beginPath()
        ctx.arc(0, -14, 22, 0, Math.PI * 2)
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.font = '24px sans-serif'
        ctx.fillStyle = 'white'
        ctx.fillText(segment.outcome.emoji, 0, -12)
      }
      
      // Label text
      ctx.font = 'bold 13px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(segment.outcome.label, 0, 23)
      
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
  }, [segments, portraits])

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
          width={560}
          height={560}
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
          width: 280px;
          height: 280px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
