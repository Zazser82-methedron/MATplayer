import { describe, it, expect } from 'vitest'
import { ARTISTS, TRACKS_BY_ID, resolveLyrics } from './index.js'

describe('data aggregation', () => {
  it('collects all three artists with cupsize first', () => {
    expect(ARTISTS.map((a) => a.artist_id)).toEqual(['cupsize', 'placeholder_a', 'placeholder_b'])
  })

  it('indexes every track by its track_id', () => {
    // 26 треков ЗМП плюс два placeholder-артиста по одному треку.
    expect(Object.keys(TRACKS_BY_ID)).toHaveLength(28)
    expect(TRACKS_BY_ID.cupsize_t10.title).toBe('ЗППП')
    expect(TRACKS_BY_ID.cupsize_t01.title).toBe('Семнадцать ножевых')
  })

  it('resolves lyrics for a known lyrics_ref', () => {
    const lines = resolveLyrics(TRACKS_BY_ID.cupsize_t10.lyrics_ref)
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
  })

  it('throws a clear error for an unknown lyrics_ref', () => {
    expect(() => resolveLyrics('nope/track-99.json')).toThrow(/No lyrics file found/)
  })
})
