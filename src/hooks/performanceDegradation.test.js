import { describe, it, expect } from 'vitest'
import {
  computeDegradationLevel,
  particleCountForLevel,
  pixelRatioForFps,
  DEGRADATION_LEVELS,
} from './performanceDegradation.js'

describe('computeDegradationLevel', () => {
  it('stays at the same level in the healthy FPS range', () => {
    expect(computeDegradationLevel(50, 0)).toBe(0)
  })
  it('steps down one level when FPS drops below 30', () => {
    expect(computeDegradationLevel(25, 0)).toBe(1)
  })
  it('does not step below the worst level', () => {
    const worst = DEGRADATION_LEVELS.length - 1
    expect(computeDegradationLevel(10, worst)).toBe(worst)
  })
  it('recovers one level when FPS climbs above 55', () => {
    expect(computeDegradationLevel(58, 2)).toBe(1)
  })
  it('does not recover above the best level', () => {
    expect(computeDegradationLevel(60, 0)).toBe(0)
  })
})

describe('particleCountForLevel', () => {
  it('is the full baseline at level 0', () => {
    expect(particleCountForLevel(0)).toBe(2000)
  })
  it('reduces at the "reduced-particles" level', () => {
    expect(particleCountForLevel(DEGRADATION_LEVELS.indexOf('reduced-particles'))).toBe(500)
  })
  it('is zero at the worst ("flat-2d") level', () => {
    expect(particleCountForLevel(DEGRADATION_LEVELS.indexOf('flat-2d'))).toBe(0)
  })
})

describe('pixelRatioForFps', () => {
  it('drops to 1.0 when FPS is under 45 and pixel ratio is above 1.0', () => {
    expect(pixelRatioForFps(40, 2, 2)).toBe(1.0)
  })
  it('increases toward the device cap when FPS is healthy', () => {
    expect(pixelRatioForFps(60, 1, 2)).toBeCloseTo(1.25, 5)
  })
  it('never exceeds the device pixel ratio', () => {
    expect(pixelRatioForFps(60, 2, 2)).toBe(2)
  })
  it('is unchanged in the middle FPS band', () => {
    expect(pixelRatioForFps(50, 1.5, 2)).toBe(1.5)
  })
})
