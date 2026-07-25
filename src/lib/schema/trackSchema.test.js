import { describe, it, expect } from 'vitest'
import { parseTrackProfile } from './trackSchema.js'

const validProfile = {
  track_id: 'cupsize_zppp',
  tempo_bpm: 135,
  energy: 0.85,
  mood: 'aggressive_grunge',
  color_palette: { background: '#0d0101', primary: '#ff0055', secondary: '#39ff14' },
  shader_presets: { noise_type: 'simplex_curly', outline_thickness: 0.05, bloom_intensity: 1.5 },
  lyrics_ref: 'cupsize/track-10.json',
  audio_src: 'cupsize/10.mp3',
}

describe('parseTrackProfile', () => {
  it('accepts a valid profile', () => {
    expect(parseTrackProfile(validProfile)).toEqual(validProfile)
  })

  it('rejects energy outside 0..1', () => {
    expect(() => parseTrackProfile({ ...validProfile, energy: 1.5 })).toThrow()
  })

  it('rejects a malformed hex color', () => {
    expect(() =>
      parseTrackProfile({
        ...validProfile,
        color_palette: { ...validProfile.color_palette, primary: 'red' },
      }),
    ).toThrow()
  })

  it('rejects a missing required field', () => {
    const { tempo_bpm, ...missingTempo } = validProfile
    expect(() => parseTrackProfile(missingTempo)).toThrow()
  })
})

describe('optional future-facing blocks', () => {
  it('still accepts every profile that ships today, with neither block present', () => {
    expect(() => parseTrackProfile(validProfile)).not.toThrow()
  })

  it('accepts structure segments, stems and spectral peaks', () => {
    expect(() =>
      parseTrackProfile({
        ...validProfile,
        audio_analysis: {
          structure_segments: [{ start: 0, end: 15.2, label: 'intro' }],
          stem_urls: { drums: 'a/drums.mp3', vocals: 'a/vocals.mp3' },
          spectral_centroid_peaks: [0.12, 0.45],
        },
      }),
    ).not.toThrow()
  })

  it('rejects a segment whose end precedes its start', () => {
    expect(() =>
      parseTrackProfile({
        ...validProfile,
        audio_analysis: { structure_segments: [{ start: 10, end: 5, label: 'intro' }] },
      }),
    ).toThrow()
  })

  it('accepts an ai_adaptation block', () => {
    expect(() =>
      parseTrackProfile({
        ...validProfile,
        ai_adaptation: { facial_blendshape_weights: [0, 0.2, 0.8], generative_prompt_seed: 4294967295 },
      }),
    ).not.toThrow()
  })

  it('rejects a negative generative seed', () => {
    expect(() =>
      parseTrackProfile({ ...validProfile, ai_adaptation: { generative_prompt_seed: -1 } }),
    ).toThrow()
  })
})
