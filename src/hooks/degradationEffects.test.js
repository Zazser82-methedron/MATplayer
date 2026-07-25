import { describe, it, expect } from 'vitest'
import { DEGRADATION_LEVELS, isBloomEnabledAtLevel, isPostFxEnabledAtLevel } from './performanceDegradation.js'

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
