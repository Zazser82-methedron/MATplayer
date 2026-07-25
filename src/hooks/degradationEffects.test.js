import { describe, it, expect } from 'vitest'
import {
  DEGRADATION_LEVELS,
  isBloomEnabledAtLevel,
  isPostFxEnabledAtLevel,
  shouldApplyLevelChange,
  MIN_FRAMES_BETWEEN_LEVEL_CHANGES,
} from './performanceDegradation.js'

describe('degradation effect predicates', () => {
  it('keeps bloom on only at the full level', () => {
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('full'))).toBe(true)
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-bloom'))).toBe(false)
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-postfx'))).toBe(false)
  })

  it('keeps post-processing on until the no-postfx level', () => {
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('full'))).toBe(true)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-bloom'))).toBe(true)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-postfx'))).toBe(false)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('flat-2d'))).toBe(false)
  })
})

describe('shouldApplyLevelChange', () => {
  it('blocks a change until the dwell time has elapsed', () => {
    expect(shouldApplyLevelChange(0)).toBe(false)
    expect(shouldApplyLevelChange(MIN_FRAMES_BETWEEN_LEVEL_CHANGES - 1)).toBe(false)
  })

  it('allows a change once the dwell time has elapsed', () => {
    expect(shouldApplyLevelChange(MIN_FRAMES_BETWEEN_LEVEL_CHANGES)).toBe(true)
    expect(shouldApplyLevelChange(MIN_FRAMES_BETWEEN_LEVEL_CHANGES + 500)).toBe(true)
  })

  it('holds the ladder for at least a second at 60fps, so post-FX cannot strobe', () => {
    expect(MIN_FRAMES_BETWEEN_LEVEL_CHANGES).toBeGreaterThanOrEqual(60)
  })
})
