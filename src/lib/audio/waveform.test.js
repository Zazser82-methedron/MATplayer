import { describe, it, expect } from 'vitest'
import { computeWaveformPeaks } from './waveform.js'

describe('computeWaveformPeaks', () => {
  it('returns exactly the requested number of buckets', () => {
    const samples = new Float32Array(1000).fill(0.5)
    expect(computeWaveformPeaks(samples, 100)).toHaveLength(100)
  })

  it('returns values normalized to 0..1', () => {
    const samples = new Float32Array(400)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i) * (i / samples.length)
    for (const peak of computeWaveformPeaks(samples, 20)) {
      expect(peak).toBeGreaterThanOrEqual(0)
      expect(peak).toBeLessThanOrEqual(1)
    }
  })

  it('scales the loudest bucket to exactly 1', () => {
    const samples = new Float32Array([0.1, 0.1, 0.9, 0.9])
    expect(Math.max(...computeWaveformPeaks(samples, 2))).toBeCloseTo(1, 6)
  })

  it('reflects relative loudness between buckets', () => {
    // Второй участок вчетверо громче первого — столбик обязан быть заметно выше.
    const samples = new Float32Array([0.2, 0.2, 0.8, 0.8])
    const [quiet, loud] = computeWaveformPeaks(samples, 2)
    expect(quiet).toBeCloseTo(0.25, 5)
    expect(loud).toBeCloseTo(1, 5)
  })

  it('does not saturate on a limited master, where peak-of-absolute would', () => {
    // Каждое окно содержит одиночный сэмпл у потолка на фоне тихого сигнала —
    // ровно то, что делает пиковую огибающую сплошным прямоугольником.
    const samples = new Float32Array(4000).fill(0.02)
    for (let i = 0; i < 4000; i += 100) samples[i] = 1
    samples[3900] = 1
    for (let i = 3800; i < 4000; i++) samples[i] = 0.9
    const peaks = computeWaveformPeaks(samples, 40)
    const nearFull = peaks.filter((p) => p > 0.9).length
    expect(nearFull).toBeLessThan(peaks.length / 2)
  })

  it('treats negative swings as equal in magnitude to positive ones', () => {
    const [a] = computeWaveformPeaks(new Float32Array([-0.8, -0.8]), 1)
    const [b] = computeWaveformPeaks(new Float32Array([0.8, 0.8]), 1)
    expect(a).toBeCloseTo(b, 6)
  })

  it('returns zeros when there are no samples', () => {
    expect(computeWaveformPeaks(new Float32Array(0), 3)).toEqual([0, 0, 0])
  })

  it('returns zeros for pure silence without dividing by zero', () => {
    const peaks = computeWaveformPeaks(new Float32Array(100), 5)
    expect(peaks).toEqual([0, 0, 0, 0, 0])
    expect(peaks.every((p) => Number.isFinite(p))).toBe(true)
  })

  it('handles fewer samples than buckets without producing NaN', () => {
    const peaks = computeWaveformPeaks(new Float32Array([0.5, 0.7]), 5)
    expect(peaks).toHaveLength(5)
    expect(peaks.every((p) => Number.isFinite(p))).toBe(true)
  })

  it('covers the whole signal — a loud tail is not lost', () => {
    const samples = new Float32Array(1000)
    for (let i = 900; i < 1000; i++) samples[i] = 1
    expect(computeWaveformPeaks(samples, 10).at(-1)).toBeCloseTo(1, 6)
  })
})
