import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudioPlaybackSync } from './useAudioPlaybackSync.js'
import { usePlayerStore } from '../store/usePlayerStore.js'

function createFakeAudioElement() {
  const listeners = {}
  return {
    addEventListener: (event, cb) => {
      listeners[event] = cb
    },
    removeEventListener: (event, cb) => {
      if (listeners[event] === cb) delete listeners[event]
    },
    dispatch: (event) => listeners[event]?.(),
  }
}

describe('useAudioPlaybackSync', () => {
  beforeEach(() => {
    usePlayerStore.setState({ isPlaying: false })
  })

  it('sets isPlaying true when the audio element fires a native play event', () => {
    const audioEl = createFakeAudioElement()
    renderHook(() => useAudioPlaybackSync({ current: audioEl }))
    audioEl.dispatch('play')
    expect(usePlayerStore.getState().isPlaying).toBe(true)
  })

  it('sets isPlaying false when the audio element fires a native pause event', () => {
    usePlayerStore.setState({ isPlaying: true })
    const audioEl = createFakeAudioElement()
    renderHook(() => useAudioPlaybackSync({ current: audioEl }))
    audioEl.dispatch('pause')
    expect(usePlayerStore.getState().isPlaying).toBe(false)
  })

  it('sets isPlaying false when playback reaches the end of the track', () => {
    // Спецификация HTML: конец ресурса выставляет paused = true, но события
    // 'pause' не поднимает. Без подписки на 'ended' кнопка так и показывала
    // бы «Pause» при тишине.
    usePlayerStore.setState({ isPlaying: true })
    const audioEl = createFakeAudioElement()
    renderHook(() => useAudioPlaybackSync({ current: audioEl }))
    audioEl.dispatch('ended')
    expect(usePlayerStore.getState().isPlaying).toBe(false)
  })

  it('does nothing and does not throw when the ref has no element', () => {
    expect(() => renderHook(() => useAudioPlaybackSync({ current: null }))).not.toThrow()
  })
})
