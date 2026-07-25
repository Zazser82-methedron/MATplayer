// src/data/lyricsResolution.test.js
import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../lib/lyrics/lyricsParser.js'

import cupsizeKnives from './tracks/cupsize/cupsize_t01_knives.json'
import cupsizeZppp from './tracks/cupsize/cupsize_zppp.json'
import cupsizeFlowers from './tracks/cupsize/cupsize_t24_flowers.json'
import placeholderATrack from './tracks/placeholder-a/track-01.json'
import placeholderBTrack from './tracks/placeholder-b/track-01.json'

const lyricsModules = import.meta.glob('./lyrics/**/*.json', { eager: true })

function resolveLyrics(lyricsRef) {
  const key = `./lyrics/${lyricsRef}`
  const mod = lyricsModules[key]
  if (!mod) throw new Error(`No lyrics file found for lyrics_ref "${lyricsRef}" (looked for ${key})`)
  return mod.default ?? mod
}

describe('lyrics_ref resolution', () => {
  const allTracks = [cupsizeKnives, cupsizeZppp, cupsizeFlowers, placeholderATrack, placeholderBTrack]

  it('resolves and parses the lyrics file referenced by every track profile', () => {
    for (const track of allTracks) {
      const raw = resolveLyrics(track.lyrics_ref)
      expect(() => parseLyrics(raw)).not.toThrow()
    }
  })
})
