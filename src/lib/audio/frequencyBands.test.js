import { describe, it, expect } from 'vitest'
import { computeFrequencyBands } from './frequencyBands.js'

describe('computeFrequencyBands', () => {
  it('returns all zeros for silence', () => {
    const freqData = new Uint8Array(1024)
    expect(computeFrequencyBands(freqData, 44100)).toEqual({ bass: 0, mid: 0, treble: 0, level: 0 })
  })

  it('isolates energy in the bass range from mid/treble', () => {
    const freqData = new Uint8Array(1024)
    for (let i = 0; i < 5; i++) freqData[i] = 255 // bins 0..4 fall inside the 20-250Hz bass range
    const bands = computeFrequencyBands(freqData, 44100)
    expect(bands.bass).toBeCloseTo(1, 5)
    expect(bands.mid).toBe(0)
    expect(bands.treble).toBe(0)
    expect(bands.level).toBeCloseTo(1 / 3, 5)
  })

  it('normalizes full-scale input to 1.0 across all bands', () => {
    const freqData = new Uint8Array(1024).fill(255)
    const bands = computeFrequencyBands(freqData, 44100)
    expect(bands.bass).toBeCloseTo(1, 5)
    expect(bands.mid).toBeCloseTo(1, 5)
    expect(bands.treble).toBeCloseTo(1, 5)
    expect(bands.level).toBeCloseTo(1, 5)
  })
})
