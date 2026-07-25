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
