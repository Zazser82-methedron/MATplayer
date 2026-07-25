import { describe, it, expect } from 'vitest'
import { ARTISTS, TRACKS_BY_ID, resolveLyrics } from './index.js'

describe('data aggregation', () => {
  it('collects all three artists with cupsize first', () => {
    expect(ARTISTS.map((a) => a.artist_id)).toEqual(['cupsize', 'placeholder_a', 'placeholder_b'])
  })

  it('indexes every track by its track_id', () => {
    expect(Object.keys(TRACKS_BY_ID).sort()).toEqual(
      ['cupsize_t01_knives', 'cupsize_t24_flowers', 'cupsize_zppp', 'placeholder_a_01', 'placeholder_b_01'].sort(),
    )
  })

  it('resolves lyrics for a known lyrics_ref', () => {
    const lines = resolveLyrics(TRACKS_BY_ID.cupsize_zppp.lyrics_ref)
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
  })

  it('throws a clear error for an unknown lyrics_ref', () => {
    expect(() => resolveLyrics('nope/track-99.json')).toThrow(/No lyrics file found/)
  })
})
