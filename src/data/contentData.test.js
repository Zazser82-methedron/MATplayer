import { describe, it, expect } from 'vitest'
import { parseArtistProfile } from '../lib/schema/artistSchema.js'
import { parseTrackProfile } from '../lib/schema/trackSchema.js'
import { ARTISTS, TRACKS_BY_ID } from './index.js'

describe('content data', () => {
  it('validates all artist profiles', () => {
    for (const artist of ARTISTS) {
      expect(() => parseArtistProfile(artist), `artist ${artist.artist_id}`).not.toThrow()
    }
  })

  it('validates all track profiles', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      expect(() => parseTrackProfile(track), `track ${track.track_id}`).not.toThrow()
    }
  })

  it('every artist track_ids entry has a matching track profile', () => {
    for (const artist of ARTISTS) {
      for (const trackId of artist.track_ids) {
        expect(TRACKS_BY_ID[trackId], `missing track profile for ${trackId}`).toBeDefined()
      }
    }
  })

  it('ships the full 26-track Cupsize album', () => {
    const cupsize = ARTISTS.find((a) => a.artist_id === 'cupsize')
    expect(cupsize.track_ids).toHaveLength(26)
  })

  it('gives every track a human title, never a derived fallback', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      expect(track.title, `track ${track.track_id} has no title`).toBeTruthy()
    }
  })

  it('covers both aggressive and melancholic moods, so both visual presets are reachable', () => {
    const moods = Object.values(TRACKS_BY_ID).map((t) => t.mood)
    expect(moods.some((m) => m.startsWith('aggressive'))).toBe(true)
    expect(moods.some((m) => m.startsWith('melancholic'))).toBe(true)
  })

  it('uses every noise_type across the catalogue', () => {
    const types = new Set(Object.values(TRACKS_BY_ID).map((t) => t.shader_presets.noise_type))
    expect(types.has('laminar')).toBe(true)
    expect(types.has('turbulent_glitch')).toBe(true)
  })
})
