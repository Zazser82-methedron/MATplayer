import { describe, it, expect } from 'vitest'
import { isPortrait, computePortraitCameraAdjustment } from './portraitAdaptation.js'

describe('isPortrait', () => {
  it('is true when height exceeds width', () => {
    expect(isPortrait(400, 800)).toBe(true)
  })
  it('is false when width exceeds or equals height', () => {
    expect(isPortrait(800, 400)).toBe(false)
    expect(isPortrait(500, 500)).toBe(false)
  })
})

describe('computePortraitCameraAdjustment', () => {
  const base = { x: 0, y: 1, z: 5 }

  it('leaves the camera unchanged in landscape', () => {
    expect(computePortraitCameraAdjustment(base, 800, 400)).toEqual(base)
  })

  it('pulls the camera back and up in portrait', () => {
    const adjusted = computePortraitCameraAdjustment(base, 400, 800)
    expect(adjusted.y).toBeGreaterThan(base.y)
    expect(adjusted.z).toBeGreaterThan(base.z)
    expect(adjusted.x).toBe(base.x)
  })
})
