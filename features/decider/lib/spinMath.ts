import type { WheelSegment } from './outcomes'

/**
 * Given a final rotation angle (in degrees), find which segment it lands on.
 * The pointer is at the top (12 o'clock position = 0°/360°).
 * The wheel rotates clockwise, so we need to calculate which segment is at top.
 */
export function getSegmentAtAngle(
  rotationDegrees: number,
  segments: WheelSegment[]
): WheelSegment | null {
  if (segments.length === 0) return null

  // Normalize rotation to 0-360
  // The wheel spins clockwise, so at rotation R degrees,
  // the segment that was at angle (360 - R mod 360) is now at top
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360
  const pointerAngle = (360 - normalizedRotation) % 360

  for (const segment of segments) {
    // Check if pointerAngle falls within this segment
    if (pointerAngle >= segment.startAngle && pointerAngle < segment.endAngle) {
      return segment
    }
  }

  // Edge case: if pointerAngle is exactly 360 (or very close), check first segment
  if (pointerAngle >= 359.99 || pointerAngle < 0.01) {
    return segments[0]
  }

  return segments[0]
}

/**
 * Generate a target rotation angle that will land on the specified segment.
 * Adds multiple full rotations for visual effect.
 */
export function generateSpinAngle(
  targetSegment: WheelSegment,
  minRotations: number = 3,
  maxRotations: number = 5
): number {
  // Pick a random angle within the target segment
  const segmentMidpoint = (targetSegment.startAngle + targetSegment.endAngle) / 2
  const segmentRange = targetSegment.endAngle - targetSegment.startAngle
  // Add some randomness within the segment (avoid edges)
  const randomOffset = (Math.random() - 0.5) * segmentRange * 0.6
  const targetAngle = segmentMidpoint + randomOffset

  // The pointer is at top, wheel rotates clockwise
  // To land targetAngle at top, we need to rotate (360 - targetAngle)
  const baseRotation = (360 - targetAngle + 360) % 360

  // Add full rotations
  const fullRotations = Math.floor(
    Math.random() * (maxRotations - minRotations + 1) + minRotations
  )

  return baseRotation + fullRotations * 360
}

/**
 * Calculate spin duration with some randomness
 */
export function getSpinDuration(): number {
  // 2.5 to 4 seconds
  return 2500 + Math.random() * 1500
}
