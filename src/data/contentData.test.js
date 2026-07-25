import { describe, it, expect } from 'vitest'
import { parseArtistProfile } from '../lib/schema/artistSchema.js'
import { parseTrackProfile } from '../lib/schema/trackSchema.js'

import cupsize from './artists/cupsize.json'
import placeholderA from './artists/placeholder-a.json'
import placeholderB from './artists/placeholder-b.json'

import cupsizeKnives from './tracks/cupsize/cupsize_t01_knives.json'
import cupsizeZppp from './tracks/cupsize/cupsize_zppp.json'
import cupsizeFlowers from './tracks/cupsize/cupsize_t24_flowers.json'
import placeholderATrack from './tracks/placeholder-a/track-01.json'
import placeholderBTrack from './tracks/placeholder-b/track-01.json'

describe('content data', () => {
  it('validates all artist profiles', () => {
    for (const artist of [cupsize, placeholderA, placeholderB]) {
      expect(() => parseArtistProfile(artist)).not.toThrow()
    }
  })

  it('validates all track profiles', () => {
    for (const track of [cupsizeKnives, cupsizeZppp, cupsizeFlowers, placeholderATrack, placeholderBTrack]) {
      expect(() => parseTrackProfile(track)).not.toThrow()
    }
  })

  it('every artist track_ids entry has a matching track profile track_id', () => {
    const allTrackIds = new Set(
      [cupsizeKnives, cupsizeZppp, cupsizeFlowers, placeholderATrack, placeholderBTrack].map(
        (t) => t.track_id,
      ),
    )
    for (const artist of [cupsize, placeholderA, placeholderB]) {
      for (const trackId of artist.track_ids) {
        expect(allTrackIds.has(trackId)).toBe(true)
      }
    }
  })

  it('cupsize and the two placeholder artists have contrasting moods', () => {
    expect(cupsizeZppp.mood).toBe('aggressive_grunge')
    expect(placeholderATrack.mood).not.toBe(placeholderBTrack.mood)
  })
})
