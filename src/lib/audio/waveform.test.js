import { describe, it, expect } from 'vitest'
import { computeWaveformPeaks } from './waveform.js'

describe('computeWaveformPeaks', () => {
  it('returns exactly the requested number of buckets', () => {
    const samples = new Float32Array(1000).fill(0.5)
    expect(computeWaveformPeaks(samples, 100)).toHaveLength(100)
  })

  it('captures the peak amplitude of each bucket', () => {
    // Float32Array хранит 0.2 как 0.20000000298 — сравниваем с допуском,
    // точное равенство здесь ловило бы точность формата, а не логику.
    const [first, second] = computeWaveformPeaks(new Float32Array([0, 0.2, 0, 0.9]), 2)
    expect(first).toBeCloseTo(0.2, 6)
    expect(second).toBeCloseTo(0.9, 6)
  })

  it('treats negative swings as equal in magnitude to positive ones', () => {
    // Среднее по знакопеременному сигналу стремится к нулю и рисует плоскую
    // линию — поэтому берём именно пик модуля.
    expect(computeWaveformPeaks(new Float32Array([-0.8, 0.1]), 1)[0]).toBeCloseTo(0.8, 6)
  })

  it('returns zeros when there are no samples', () => {
    expect(computeWaveformPeaks(new Float32Array(0), 3)).toEqual([0, 0, 0])
  })

  it('handles fewer samples than buckets without producing NaN', () => {
    const peaks = computeWaveformPeaks(new Float32Array([0.5, 0.7]), 5)
    expect(peaks).toHaveLength(5)
    expect(peaks.every((p) => Number.isFinite(p))).toBe(true)
  })

  it('covers the whole signal — a spike in the last sample is not lost', () => {
    const samples = new Float32Array(999)
    samples[998] = 1
    expect(computeWaveformPeaks(samples, 10).at(-1)).toBe(1)
  })
})
