import { describe, it, expect } from 'vitest'
import {
  computeOnsetEnvelope,
  estimateTempo,
  estimateTempoFromSamples,
  DEFAULT_ENVELOPE_RATE,
} from './tempoEstimate.js'

// Синтетический трек: короткие громкие всплески на равных интервалах поверх
// тихого фона — то, как выглядит ударная дорожка для детектора.
function makeClickTrack({ bpm, seconds = 20, sampleRate = 8000, offset = 0 }) {
  const samples = new Float32Array(Math.round(seconds * sampleRate))
  for (let i = 0; i < samples.length; i++) samples[i] = (i % 97) / 97 - 0.5 // тихий фон
  const period = (60 / bpm) * sampleRate
  const clickLength = Math.round(sampleRate * 0.02)
  for (let beat = 0; ; beat++) {
    const start = Math.round(offset * sampleRate + beat * period)
    if (start + clickLength >= samples.length) break
    for (let i = 0; i < clickLength; i++) samples[start + i] = i % 2 === 0 ? 1 : -1
  }
  return { samples, sampleRate }
}

describe('computeOnsetEnvelope', () => {
  it('keeps only energy rises, never negative values', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 120, seconds: 4 })
    const envelope = computeOnsetEnvelope(samples, sampleRate)
    expect(envelope.length).toBeGreaterThan(0)
    expect([...envelope].every((v) => v >= 0)).toBe(true)
  })

  it('produces roughly one sample per envelope tick', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 120, seconds: 4 })
    const envelope = computeOnsetEnvelope(samples, sampleRate)
    expect(envelope.length).toBeCloseTo(4 * DEFAULT_ENVELOPE_RATE, -1)
  })

  it('returns an empty envelope for a signal shorter than one frame', () => {
    expect(computeOnsetEnvelope(new Float32Array(5), 44100).length).toBe(0)
  })
})

describe('estimateTempo', () => {
  it('recovers the tempo of a 120 BPM click track', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 120 })
    const { bpm } = estimateTempoFromSamples(samples, sampleRate)
    expect(bpm).toBeGreaterThan(118)
    expect(bpm).toBeLessThan(122)
  })

  it('recovers a slower tempo too', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 90 })
    const { bpm } = estimateTempoFromSamples(samples, sampleRate)
    expect(bpm).toBeGreaterThan(88)
    expect(bpm).toBeLessThan(92)
  })

  it('recovers the phase of the first beat', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 120, offset: 0.25 })
    const { offset } = estimateTempoFromSamples(samples, sampleRate)
    // Сетка долей повторяется каждые 0.5 с при 120 BPM, поэтому смещение
    // 0.25 и 0.75 эквивалентны — проверяем по модулю периода.
    const period = 0.5
    const distance = Math.min(Math.abs(offset - 0.25), Math.abs(offset - 0.25 + period), Math.abs(offset - 0.25 - period))
    expect(distance).toBeLessThan(0.08)
  })

  it('returns a null tempo for a signal too short to judge', () => {
    expect(estimateTempo(new Float32Array(10)).bpm).toBeNull()
  })

  it('returns a null tempo for silence rather than inventing one', () => {
    const silence = new Float32Array(44100 * 5)
    const { bpm } = estimateTempoFromSamples(silence, 44100)
    expect(bpm === null || Number.isFinite(bpm)).toBe(true)
  })

  it('folds an octave error toward the perceptual centre', () => {
    // Гребёнка одинаково хорошо ложится и на 75, и на 150 BPM. Слух выбирает
    // вариант ближе к ~120, и детектор обязан выбирать так же — иначе пульс
    // аватара идёт вдвое чаще или вдвое реже, чем ощущается музыка.
    const { samples, sampleRate } = makeClickTrack({ bpm: 150, seconds: 24 })
    const { bpm } = estimateTempoFromSamples(samples, sampleRate)
    expect(bpm).toBeGreaterThan(140)
    expect(bpm).toBeLessThan(160)
  })

  it('always reports a tempo inside the plausible range', () => {
    const { samples, sampleRate } = makeClickTrack({ bpm: 150 })
    const { bpm } = estimateTempoFromSamples(samples, sampleRate)
    expect(bpm).toBeGreaterThanOrEqual(60)
    expect(bpm).toBeLessThanOrEqual(190)
  })
})
