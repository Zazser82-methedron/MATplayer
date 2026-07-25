import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './usePlayerStore.js'

const defaults = {
  currentArtistId: null,
  currentTrackId: null,
  currentTime: 0,
  isPlaying: false,
  uxMode: 'focus',
  audioBands: { bass: 0, mid: 0, treble: 0, level: 0 },
}

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState(defaults)
  })

  it('starts with sane defaults', () => {
    expect(usePlayerStore.getState().currentArtistId).toBeNull()
    expect(usePlayerStore.getState().uxMode).toBe('focus')
  })

  it('setArtist updates currentArtistId without touching other fields', () => {
    usePlayerStore.getState().setArtist('cupsize')
    expect(usePlayerStore.getState().currentArtistId).toBe('cupsize')
    expect(usePlayerStore.getState().uxMode).toBe('focus')
  })

  it('setAudioBands replaces the audioBands object', () => {
    usePlayerStore.getState().setAudioBands({ bass: 0.5, mid: 0.2, treble: 0.1, level: 0.27 })
    expect(usePlayerStore.getState().audioBands.bass).toBe(0.5)
  })

  it('setUxMode accepts focus/ambient/utility', () => {
    usePlayerStore.getState().setUxMode('ambient')
    expect(usePlayerStore.getState().uxMode).toBe('ambient')
  })
})
