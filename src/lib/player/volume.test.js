import { describe, it, expect } from 'vitest'
import { uiVolumeToGain, gainToUiVolume, clampVolume } from './volume.js'

describe('uiVolumeToGain', () => {
  it('maps the endpoints exactly', () => {
    expect(uiVolumeToGain(0)).toBe(0)
    expect(uiVolumeToGain(1)).toBe(1)
  })

  it('is quieter than linear in the middle, matching perceived loudness', () => {
    expect(uiVolumeToGain(0.5)).toBeCloseTo(0.125, 5)
    expect(uiVolumeToGain(0.5)).toBeLessThan(0.5)
  })

  it('is monotonically increasing', () => {
    let previous = -1
    for (let v = 0; v <= 1.0001; v += 0.1) {
      const gain = uiVolumeToGain(v)
      expect(gain).toBeGreaterThan(previous)
      previous = gain
    }
  })
})

describe('gainToUiVolume', () => {
  it('round-trips with uiVolumeToGain', () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      expect(gainToUiVolume(uiVolumeToGain(v))).toBeCloseTo(v, 5)
    }
  })
})

describe('clampVolume', () => {
  it('keeps values inside 0..1', () => {
    expect(clampVolume(-0.5)).toBe(0)
    expect(clampVolume(1.5)).toBe(1)
    expect(clampVolume(0.3)).toBe(0.3)
  })
})
