import { describe, it, expect } from 'vitest'
import {
  deriveTrackTitleFallback,
  formatMood,
  buildLibraryEntries,
  searchLibraryEntries,
  groupEntriesByAlbum,
} from './buildLibrary.js'

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

describe('buildLibraryEntries with albums', () => {
  const artists = [{ artist_id: 'a', name: 'Artist A', track_ids: ['a1', 'a2', 'a3'] }]
  const tracksById = {
    a1: { track_id: 'a1', title: 'One', mood: 'happy_pop', tempo_bpm: 120 },
    a2: { track_id: 'a2', title: 'Two', mood: 'sad_ballad', tempo_bpm: 80 },
    a3: { track_id: 'a3', title: 'Three', mood: 'happy_pop', tempo_bpm: 100 },
  }
  const albums = [
    { album_id: 'lp', artist_id: 'a', title: 'Долгоиграющий', track_ids: ['a2', 'a1'] },
    { album_id: 'ep', artist_id: 'a', title: 'Мини', track_ids: ['a3'] },
  ]

  it('tags each entry with its album', () => {
    const entries = buildLibraryEntries(artists, tracksById, albums)
    expect(entries.find((e) => e.trackId === 'a1')).toMatchObject({ albumId: 'lp', albumTitle: 'Долгоиграющий' })
    expect(entries.find((e) => e.trackId === 'a3')).toMatchObject({ albumId: 'ep', albumTitle: 'Мини' })
  })

  it('takes track order from the album, not from the artist', () => {
    // У артиста порядок a1,a2,a3 — но альбом задаёт a2,a1.
    const entries = buildLibraryEntries(artists, tracksById, albums)
    expect(entries.map((e) => e.trackId)).toEqual(['a2', 'a1', 'a3'])
  })

  it('falls back to the flat artist list when no albums are given', () => {
    const entries = buildLibraryEntries(artists, tracksById)
    expect(entries.map((e) => e.trackId)).toEqual(['a1', 'a2', 'a3'])
    expect(entries[0].albumId).toBeNull()
  })
})

describe('groupEntriesByAlbum', () => {
  const entries = [
    { trackId: 't1', albumId: 'lp', albumTitle: 'LP', artistId: 'a', artistName: 'A' },
    { trackId: 't2', albumId: 'lp', albumTitle: 'LP', artistId: 'a', artistName: 'A' },
    { trackId: 't3', albumId: 'ep', albumTitle: 'EP', artistId: 'a', artistName: 'A' },
  ]

  it('groups by album, preserving order of first appearance', () => {
    const groups = groupEntriesByAlbum(entries)
    expect(groups.map((g) => g.albumId)).toEqual(['lp', 'ep'])
    expect(groups[0].entries).toHaveLength(2)
  })

  it('keeps entries without an album in their own group', () => {
    const groups = groupEntriesByAlbum([{ trackId: 'x', albumId: null, artistId: 'a', artistName: 'A' }])
    expect(groups).toHaveLength(1)
    expect(groups[0].albumId).toBeNull()
  })

  it('does not merge same-titled albums from different artists', () => {
    const groups = groupEntriesByAlbum([
      { trackId: 'x', albumId: 'a_singles', albumTitle: 'Синглы', artistId: 'a', artistName: 'A' },
      { trackId: 'y', albumId: 'b_singles', albumTitle: 'Синглы', artistId: 'b', artistName: 'B' },
    ])
    expect(groups).toHaveLength(2)
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
