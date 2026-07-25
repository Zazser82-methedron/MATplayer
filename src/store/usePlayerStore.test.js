import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './usePlayerStore.js'

const defaults = {
  currentArtistId: null,
  currentTrackId: null,
  currentTime: 0,
  isPlaying: false,
  uxMode: 'focus',
  audioBands: { bass: 0, mid: 0, treble: 0, level: 0 },
  particleVisibleCount: 2000,
  degradationLevel: 0,
  repeatMode: 'off',
  isShuffled: false,
  shuffledOrder: [],
  favorites: [],
  history: [],
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

  it('setParticleVisibleCount updates particleVisibleCount', () => {
    usePlayerStore.getState().setParticleVisibleCount(500)
    expect(usePlayerStore.getState().particleVisibleCount).toBe(500)
  })

  it('setDegradationLevel updates degradationLevel', () => {
    usePlayerStore.getState().setDegradationLevel(2)
    expect(usePlayerStore.getState().degradationLevel).toBe(2)
  })

  it('toggleFavorite adds then removes a track', () => {
    usePlayerStore.getState().toggleFavorite('t1')
    expect(usePlayerStore.getState().favorites).toEqual(['t1'])
    usePlayerStore.getState().toggleFavorite('t1')
    expect(usePlayerStore.getState().favorites).toEqual([])
  })

  it('recordPlay pushes onto history newest-first', () => {
    usePlayerStore.getState().recordPlay('t1')
    usePlayerStore.getState().recordPlay('t2')
    expect(usePlayerStore.getState().history).toEqual(['t2', 't1'])
  })
})
