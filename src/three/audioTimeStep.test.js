import { describe, it, expect } from 'vitest'
import { mapLinear, clamp, computeAudioTimeStep, computeCurlAmplitude } from './audioTimeStep.js'

describe('mapLinear', () => {
  it('maps the midpoint linearly', () => {
    expect(mapLinear(0.5, 0, 1, 0, 10)).toBeCloseTo(5, 5)
  })
  it('extrapolates outside the input range', () => {
    expect(mapLinear(2, 0, 1, 0, 10)).toBeCloseTo(20, 5)
  })
})

describe('clamp', () => {
  it('passes values through inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps below the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('clamps above the maximum', () => {
    expect(clamp(50, 0, 10)).toBe(10)
  })
})

describe('computeAudioTimeStep', () => {
  it('clamps to 0.2 at low bass', () => {
    expect(computeAudioTimeStep(0)).toBe(0.2)
  })
  it('clamps to 0.5 at full bass', () => {
    expect(computeAudioTimeStep(1)).toBe(0.5)
  })
  it('interpolates in between', () => {
    expect(computeAudioTimeStep(0.8)).toBeCloseTo(0.35, 5)
  })
})

describe('computeCurlAmplitude', () => {
  it('is 0.8 at zero high-frequency energy', () => {
    expect(computeCurlAmplitude(0)).toBeCloseTo(0.8, 5)
  })
  it('reaches 1.0 at the 0.6 reference point', () => {
    expect(computeCurlAmplitude(0.6)).toBeCloseTo(1.0, 5)
  })
})
