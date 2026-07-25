import { describe, it, expect } from 'vitest'
import { computeCrossfadeGains } from './crossfade.js'

describe('computeCrossfadeGains', () => {
  it('is fully outgoing at progress=0', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(0)
    expect(outgoingGain).toBeCloseTo(1, 5)
    expect(incomingGain).toBeCloseTo(0, 5)
  })

  it('is fully incoming at progress=1', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(1)
    expect(outgoingGain).toBeCloseTo(0, 5)
    expect(incomingGain).toBeCloseTo(1, 5)
  })

  it('holds constant total power across the whole fade', () => {
    // Equal-power: сумма квадратов усилений равна 1 в любой точке перехода.
    // Линейный кроссфейд здесь дал бы 0.5 в середине — слышимый провал
    // громкости примерно на 3 дБ.
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const { outgoingGain, incomingGain } = computeCrossfadeGains(p)
      expect(outgoingGain ** 2 + incomingGain ** 2).toBeCloseTo(1, 5)
    }
  })

  it('is symmetric at the midpoint', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(0.5)
    expect(outgoingGain).toBeCloseTo(Math.SQRT1_2, 5)
    expect(incomingGain).toBeCloseTo(Math.SQRT1_2, 5)
  })

  it('clamps progress below 0', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(-0.3)
    expect(outgoingGain).toBeCloseTo(1, 5)
    expect(incomingGain).toBeCloseTo(0, 5)
  })

  it('clamps progress above 1', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(1.3)
    expect(outgoingGain).toBeCloseTo(0, 5)
    expect(incomingGain).toBeCloseTo(1, 5)
  })

  it('moves monotonically in both directions', () => {
    let previousOut = Infinity
    let previousIn = -Infinity
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { outgoingGain, incomingGain } = computeCrossfadeGains(p)
      expect(outgoingGain).toBeLessThanOrEqual(previousOut + 1e-9)
      expect(incomingGain).toBeGreaterThanOrEqual(previousIn - 1e-9)
      previousOut = outgoingGain
      previousIn = incomingGain
    }
  })
})
