import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWheelSegments, calculateProbabilities, determineBestOf3Winner } from '../features/decider/lib/outcomes'
import { generateSpinAngle, getSegmentAtAngle } from '../features/decider/lib/spinMath'

test('successive spins land on the selected outcome at every bias', () => {
  for (const discuss of [true, false]) {
    for (const bias of [0, 1, 25, 50, 75, 99, 100]) {
      const segments = buildWheelSegments(bias, discuss)
      let rotation = 137.5
      for (let round = 0; round < 10; round++) {
        for (const segment of segments.filter(s => s.probability > 0)) {
          const next = generateSpinAngle(segment, 3, 5, rotation)
          assert.ok(next - rotation >= 3 * 360, 'must spin forward at least three turns')
          assert.equal(getSegmentAtAngle(next, segments)?.outcome.id, segment.outcome.id)
          rotation = next
        }
      }
    }
  }
})

test('probabilities include exactly the enabled outcomes and total 100%', () => {
  for (const discuss of [true, false]) {
    for (const bias of [0, 25, 50, 75, 100]) {
      const probabilities = calculateProbabilities(bias, discuss)
      assert.ok(Math.abs(probabilities.reduce((sum, p) => sum + p.probability, 0) - 1) < 1e-10)
      assert.equal(probabilities.some(p => p.outcomeId === 'discuss'), discuss)
    }
  }
  assert.equal(calculateProbabilities(0, false)[0].probability, 1)
  assert.equal(calculateProbabilities(100, false)[0].probability, 0)
})

test('best of three uses majority and resolves a three-way tie with the last spin', () => {
  assert.equal(determineBestOf3Winner(['yier', 'bubu', 'yier']), 'yier')
  assert.equal(determineBestOf3Winner(['bubu', 'bubu', 'discuss']), 'bubu')
  assert.equal(determineBestOf3Winner(['yier', 'bubu', 'discuss']), 'discuss')
})


test('compromise is absent by default and its odds return to the two proposals', () => {
  assert.deepEqual(calculateProbabilities(50, false), [
    { outcomeId: 'yier', probability: 0.5 },
    { outcomeId: 'bubu', probability: 0.5 },
  ])
  for (const discuss of [true, false]) {
    const segments = buildWheelSegments(50, discuss)
    assert.ok(segments.every(s => ['yier', 'bubu', 'discuss'].includes(s.outcome.id)))
    assert.equal(determineBestOf3Winner(['yier', 'bubu', 'discuss']), 'discuss')
  }
})


test('moving the slider right always increases Bubu odds and decreases Yier odds', () => {
  for (const discuss of [true, false]) {
    let previous = calculateProbabilities(0, discuss)
    for (let bias = 1; bias <= 100; bias++) {
      const current = calculateProbabilities(bias, discuss)
      assert.ok(current[1].probability > previous[1].probability)
      assert.ok(current[0].probability < previous[0].probability)
      const bubuSegment = buildWheelSegments(bias, discuss).find(s => s.outcome.id === 'bubu')!
      assert.ok(Math.abs((bubuSegment.endAngle - bubuSegment.startAngle) / 360 - current[1].probability) < 1e-10)
      previous = current
    }
    assert.equal(previous[1].probability, discuss ? 0.9 : 1)
  }
})
