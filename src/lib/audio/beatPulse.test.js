import { describe, it, expect } from 'vitest'
import { computeBeatPhase, computeBeatPulse } from './beatPulse.js'

describe('computeBeatPhase', () => {
  it('is 0 exactly on a beat', () => {
    // 120 BPM = 2 доли в секунду, значит доли на 0, 0.5, 1.0 с
    expect(computeBeatPhase(0, 120)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(0.5, 120)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(1.0, 120)).toBeCloseTo(0, 5)
  })

  it('is 0.5 exactly between two beats', () => {
    expect(computeBeatPhase(0.25, 120)).toBeCloseTo(0.5, 5)
  })

  it('stays within 0..1', () => {
    for (const t of [0.1, 3.7, 42.42]) {
      const phase = computeBeatPhase(t, 135)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThan(1)
    }
  })

  it('returns 0 for a missing or invalid BPM', () => {
    expect(computeBeatPhase(1.3, null)).toBe(0)
    expect(computeBeatPhase(1.3, 0)).toBe(0)
    expect(computeBeatPhase(1.3, -60)).toBe(0)
  })

  it('anchors the grid to the detected first beat', () => {
    // Первая доля на 0.25 с: фаза обязана обнуляться там, а не в нуле.
    expect(computeBeatPhase(0.25, 120, 0.25)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(0.75, 120, 0.25)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(0.5, 120, 0.25)).toBeCloseTo(0.5, 5)
  })

  it('stays inside 0..1 before the first beat, where the offset makes time negative', () => {
    for (const t of [0, 0.05, 0.2]) {
      const phase = computeBeatPhase(t, 120, 0.25)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThan(1)
    }
  })
})

describe('computeBeatPulse', () => {
  it('peaks at 1 on the beat', () => {
    expect(computeBeatPulse(0, 120)).toBeCloseTo(1, 5)
  })

  it('decays to near zero before the next beat', () => {
    expect(computeBeatPulse(0.45, 120)).toBeLessThan(0.05)
  })

  it('decays monotonically between beats', () => {
    // Точки берём явно и не доводим до следующей доли: ровно на ней фаза
    // законно обнуляется и импульс скачком возвращается к 1, так что
    // накопление t += 0.05 упиралось бы в границу и ложно падало.
    let previous = Infinity
    for (const t of [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]) {
      const pulse = computeBeatPulse(t, 120)
      expect(pulse).toBeLessThanOrEqual(previous + 1e-9)
      previous = pulse
    }
  })

  it('fires again on the next beat', () => {
    expect(computeBeatPulse(0.5, 120)).toBeCloseTo(1, 5)
  })

  it('is flat at zero when BPM is unknown', () => {
    expect(computeBeatPulse(1.3, null)).toBe(0)
  })

  it('never leaves 0..1, so callers can scale it directly', () => {
    for (let t = 0; t < 3; t += 0.017) {
      const pulse = computeBeatPulse(t, 135)
      expect(pulse).toBeGreaterThanOrEqual(0)
      expect(pulse).toBeLessThanOrEqual(1)
    }
  })
})
