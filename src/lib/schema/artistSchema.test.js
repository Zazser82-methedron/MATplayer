import { describe, it, expect } from 'vitest'
import { parseArtistProfile } from './artistSchema.js'

const validArtist = {
  artist_id: 'cupsize',
  name: 'Cupsize',
  default_palette: { background: '#0d0101', primary: '#ff0055' },
  atlas_position: { x: 0, y: 0, z: 0 },
  track_ids: ['cupsize_zppp'],
}

describe('parseArtistProfile', () => {
  it('accepts a valid artist profile', () => {
    expect(parseArtistProfile(validArtist)).toEqual(validArtist)
  })

  it('rejects an empty track_ids list', () => {
    expect(() => parseArtistProfile({ ...validArtist, track_ids: [] })).toThrow()
  })

  it('rejects a non-numeric atlas_position field', () => {
    expect(() =>
      parseArtistProfile({ ...validArtist, atlas_position: { x: '0', y: 0, z: 0 } }),
    ).toThrow()
  })
})
