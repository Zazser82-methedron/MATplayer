import { describe, it, expect } from 'vitest'
import { computeBreathScale, computeBlinkScale, BLINK_DURATION, BLINK_INTERVAL } from './avatarMotion.js'

describe('computeBreathScale', () => {
  it('is 1 at t=0', () => {
    expect(computeBreathScale(0, 0.5)).toBeCloseTo(1, 5)
  })

  it('stays within the configured amplitude', () => {
    for (let t = 0; t < 5; t += 0.1) {
      const scale = computeBreathScale(t, 0.5)
      expect(scale).toBeGreaterThanOrEqual(0.95)
      expect(scale).toBeLessThanOrEqual(1.05)
    }
  })

  it('breathes faster at higher energy', () => {
    const low = computeBreathScale(0.3, 0)
    const high = computeBreathScale(0.3, 1)
    expect(high).not.toBeCloseTo(low, 3)
  })
})

describe('computeBlinkScale', () => {
  it('is 1 (eyes open) outside the blink window', () => {
    expect(computeBlinkScale(1)).toBe(1)
    expect(computeBlinkScale(BLINK_DURATION + 0.5)).toBe(1)
  })

  it('dips well below 1 mid-blink', () => {
    expect(computeBlinkScale(BLINK_DURATION / 2)).toBeLessThan(0.2)
  })

  it('returns to 1 at the exact end of the blink window', () => {
    expect(computeBlinkScale(BLINK_DURATION)).toBe(1)
  })

  it('repeats every BLINK_INTERVAL seconds', () => {
    expect(computeBlinkScale(BLINK_DURATION / 2)).toBeCloseTo(
      computeBlinkScale(BLINK_DURATION / 2 + BLINK_INTERVAL),
      10,
    )
  })
})
