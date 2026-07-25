import { describe, it, expect } from 'vitest'
import { noiseTypeToFloat, NOISE_TYPE_SIMPLEX_CURLY, NOISE_TYPE_LAMINAR, NOISE_TYPE_TURBULENT_GLITCH } from './noiseTypes.js'

describe('noiseTypeToFloat', () => {
  it('maps each known noise_type to its shader constant', () => {
    expect(noiseTypeToFloat('simplex_curly')).toBe(NOISE_TYPE_SIMPLEX_CURLY)
    expect(noiseTypeToFloat('laminar')).toBe(NOISE_TYPE_LAMINAR)
    expect(noiseTypeToFloat('turbulent_glitch')).toBe(NOISE_TYPE_TURBULENT_GLITCH)
  })

  it('gives every type a distinct value so the shader can branch on them', () => {
    const values = new Set([NOISE_TYPE_SIMPLEX_CURLY, NOISE_TYPE_LAMINAR, NOISE_TYPE_TURBULENT_GLITCH])
    expect(values.size).toBe(3)
  })

  it('falls back to simplex_curly for an unknown type', () => {
    expect(noiseTypeToFloat('nonsense')).toBe(NOISE_TYPE_SIMPLEX_CURLY)
    expect(noiseTypeToFloat(undefined)).toBe(NOISE_TYPE_SIMPLEX_CURLY)
  })
})
