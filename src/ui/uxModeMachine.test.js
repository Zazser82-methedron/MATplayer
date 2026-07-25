import { describe, it, expect } from 'vitest'
import { computeUxMode, UTILITY_HOLD_SECONDS, AMBIENT_THRESHOLD_SECONDS } from './uxModeMachine.js'

describe('computeUxMode', () => {
  it('is utility immediately after activity', () => {
    expect(computeUxMode(0)).toBe('utility')
  })

  it('stays utility just under the hold threshold', () => {
    expect(computeUxMode(UTILITY_HOLD_SECONDS - 0.1)).toBe('utility')
  })

  it('becomes focus once past the utility hold', () => {
    expect(computeUxMode(UTILITY_HOLD_SECONDS)).toBe('focus')
  })

  it('stays focus just under the ambient threshold', () => {
    expect(computeUxMode(AMBIENT_THRESHOLD_SECONDS - 0.1)).toBe('focus')
  })

  it('becomes ambient at and past the ambient threshold', () => {
    expect(computeUxMode(AMBIENT_THRESHOLD_SECONDS)).toBe('ambient')
    expect(computeUxMode(999)).toBe('ambient')
  })
})
