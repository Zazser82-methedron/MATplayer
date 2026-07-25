import { describe, it, expect } from 'vitest'
import { deriveTrackTitleFallback, formatMood, buildLibraryEntries, searchLibraryEntries } from './buildLibrary.js'

describe('deriveTrackTitleFallback', () => {
  it('strips the artist-id prefix and a leading track-number token', () => {
    expect(deriveTrackTitleFallback('cupsize_t01_knives')).toBe('Knives')
  })

  it('falls back gracefully when there is no number token', () => {
    expect(deriveTrackTitleFallback('cupsize_zppp')).toBe('Zppp')
  })
})

describe('formatMood', () => {
  it('title-cases each underscore-separated word', () => {
    expect(formatMood('aggressive_grunge')).toBe('Aggressive Grunge')
  })
})

describe('buildLibraryEntries', () => {
  const artists = [
    { artist_id: 'a', name: 'Artist A', track_ids: ['a1', 'a_song_two'] },
    { artist_id: 'b', name: 'Artist B', track_ids: ['b1', 'missing'] },
  ]
  const tracksById = {
    a1: { track_id: 'a1', title: 'Song One', mood: 'happy_pop', tempo_bpm: 120 },
    a_song_two: { track_id: 'a_song_two', mood: 'sad_ballad', tempo_bpm: 80 },
    b1: { track_id: 'b1', title: 'Song Three', mood: 'happy_pop', tempo_bpm: 100 },
  }

  it('flattens every artist track_ids entry that has a matching track', () => {
    const entries = buildLibraryEntries(artists, tracksById)
    expect(entries).toHaveLength(3)
    expect(entries.map((e) => e.trackId)).toEqual(['a1', 'a_song_two', 'b1'])
  })

  it('uses the explicit title when present, else derives one', () => {
    const entries = buildLibraryEntries(artists, tracksById)
    expect(entries.find((e) => e.trackId === 'a1').title).toBe('Song One')
    expect(entries.find((e) => e.trackId === 'a_song_two').title).toBe('Song Two')
  })

  it('skips track_ids with no matching track profile', () => {
    const entries = buildLibraryEntries(artists, tracksById)
    expect(entries.some((e) => e.trackId === 'missing')).toBe(false)
  })

  it('carries the owning artist id and name onto each entry', () => {
    const entries = buildLibraryEntries(artists, tracksById)
    expect(entries.find((e) => e.trackId === 'b1')).toMatchObject({ artistId: 'b', artistName: 'Artist B' })
  })
})

describe('searchLibraryEntries', () => {
  const entries = [
    { trackId: 'a1', title: 'Song One', artistName: 'Artist A', mood: 'happy_pop' },
    { trackId: 'b1', title: 'Song Three', artistName: 'Artist B', mood: 'melancholic_dreampop' },
  ]

  it('returns everything for an empty query', () => {
    expect(searchLibraryEntries(entries, '')).toHaveLength(2)
    expect(searchLibraryEntries(entries, '   ')).toHaveLength(2)
  })

  it('matches by title, case-insensitively', () => {
    expect(searchLibraryEntries(entries, 'song one')).toEqual([entries[0]])
  })

  it('matches by artist name', () => {
    expect(searchLibraryEntries(entries, 'artist b')).toEqual([entries[1]])
  })

  it('matches by mood', () => {
    expect(searchLibraryEntries(entries, 'dreampop')).toEqual([entries[1]])
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchLibraryEntries(entries, 'nonexistent')).toEqual([])
  })
})
